/**
 * Audits and cleans up HeadCV Pro product pricing in Dodo Payments.
 *
 * Goal: ensure products use Adaptive Currency (live FX) and have no
 * localized prices that override the customer's currency.
 *
 * Dry run (default) — lists products, pricing_mode, and localized prices:
 *   DODO_PAYMENTS_API_KEY=... DODO_PAYMENTS_ENVIRONMENT=live_mode node scripts/dodo-audit-pricing.mjs
 * Apply for real:
 *   ... node scripts/dodo-audit-pricing.mjs --apply
 */
import DodoPayments from "dodopayments";

const apiKey = process.env.DODO_PAYMENTS_API_KEY;
const environment = process.env.DODO_PAYMENTS_ENVIRONMENT;
const apply = process.argv.includes("--apply");

if (!apiKey) throw new Error("Set DODO_PAYMENTS_API_KEY in the environment (never pass it as an argument).");
if (environment !== "test_mode" && environment !== "live_mode") {
	throw new Error('Set DODO_PAYMENTS_ENVIRONMENT to "test_mode" or "live_mode" explicitly.');
}
if (
	!apiKey.startsWith(environment === "live_mode" ? "dodo_live_" : "dodo_test_") &&
	/^dodo_(live|test)_/.test(apiKey)
) {
	throw new Error(`API key prefix does not match ${environment}.`);
}

const client = new DodoPayments({ bearerToken: apiKey, environment });

const HEADCV_NAMES = new Set(["HeadCV Pro Monthly", "HeadCV Pro Yearly", "HeadCV Pro 7-Day Trial"]);

async function auditProduct(product) {
	const detail = await client.products.retrieve(product.product_id);
	const localized = await client.products.localizedPrices.list(product.product_id);

	const prices = localized.items ?? localized ?? [];

	return {
		id: product.product_id,
		name: product.name,
		pricingMode: detail.pricing_mode ?? "unknown",
		baseCurrency: detail.price_detail?.currency ?? detail.price?.currency ?? "unknown",
		basePrice: detail.price_detail?.price ?? detail.price?.price ?? null,
		localizedPrices: prices.map((lp) => ({
			id: lp.localized_price_id ?? lp.id,
			country: lp.country_code,
			currency: lp.currency,
			amount: lp.amount,
		})),
	};
}

console.log(`Environment: ${environment}${apply ? "" : " (dry run — add --apply to change)"}\n`);

const products = [];
for await (const product of client.products.list()) {
	if (HEADCV_NAMES.has(product.name)) products.push(product);
}

if (products.length === 0) {
	console.log("No HeadCV Pro products found.");
	process.exit(0);
}

let changes = 0;

for (const product of products) {
	const audit = await auditProduct(product);
	console.log(`Product: ${audit.name} (${audit.id})`);
	console.log(`  pricing_mode: ${audit.pricingMode}`);
	console.log(`  base: ${audit.basePrice ? audit.basePrice / 100 : "?"} ${audit.baseCurrency}`);

	if (audit.localizedPrices.length === 0) {
		console.log("  localized prices: none");
	} else {
		console.log(`  localized prices: ${audit.localizedPrices.length}`);
		for (const lp of audit.localizedPrices) {
			console.log(`    - ${lp.id}: ${lp.amount / 100} ${lp.currency} (${lp.country ?? "no country"})`);
		}
	}

	const needsModeChange = audit.pricingMode !== "by_currency";
	const needsPriceCleanup = audit.localizedPrices.length > 0;

	if (needsModeChange) {
		console.log(`  → would set pricing_mode to "by_currency"`);
	}
	if (needsPriceCleanup) {
		console.log(`  → would archive ${audit.localizedPrices.length} localized price(s)`);
	}
	if (!needsModeChange && !needsPriceCleanup) {
		console.log("  → no changes needed");
	}

	if (apply && (needsModeChange || needsPriceCleanup)) {
		if (needsModeChange) {
			await client.products.update(audit.id, { pricing_mode: "by_currency" });
			console.log("  ✓ pricing_mode updated to by_currency");
		}
		for (const lp of audit.localizedPrices) {
			await client.products.localizedPrices.archive(lp.id, { product_id: audit.id });
			console.log(`  ✓ archived localized price ${lp.id}`);
		}
		changes++;
	}

	console.log();
}

if (apply) {
	console.log(`Applied changes to ${changes} product(s).`);
} else {
	console.log("Dry run complete. Add --apply to make these changes.");
}
