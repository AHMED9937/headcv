/**
 * Creates the HeadCV Pro products in Dodo Payments (idempotent: existing names are skipped).
 *
 * Dry run (default) — lists existing products and what would be created:
 *   DODO_PAYMENTS_API_KEY=... DODO_PAYMENTS_ENVIRONMENT=live_mode node scripts/dodo-setup-products.mjs
 * Create for real:
 *   ... node scripts/dodo-setup-products.mjs --apply
 *
 * Prices are in cents and must match the app UI ($20/mo, $60/yr, and a $3 one-time 7-day trial pass).
 * The trial is its own one-time product, so nothing can renew or convert after it; the plans carry no trial.
 * Existing products are not updated here; scripts/dodo-retire-trials.mjs removes old trials from them.
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

const recurring = (price, interval, count, extra = {}) => ({
	type: "recurring_price",
	currency: "USD",
	price,
	discount: 0,
	purchasing_power_parity: false,
	payment_frequency_count: count,
	payment_frequency_interval: interval,
	// How long the subscription runs before it needs renewal: effectively "until cancelled".
	subscription_period_count: 10,
	subscription_period_interval: "Year",
	...extra,
});

const oneTime = (price) => ({
	type: "one_time_price",
	currency: "USD",
	price,
	discount: 0,
	purchasing_power_parity: false,
});

const PRODUCTS = [
	{
		env: "DODO_PRODUCT_MONTHLY_ID",
		name: "HeadCV Pro Monthly",
		description: "Unlimited resumes, cover letters, imports and AI assistance. Billed monthly, cancel anytime.",
		price: recurring(2000, "Month", 1),
		metadata: { plan: "monthly" },
	},
	{
		env: "DODO_PRODUCT_YEARLY_ID",
		name: "HeadCV Pro Yearly",
		description: "Everything in Pro for one year — save 75% compared with monthly. Cancel anytime.",
		price: recurring(6000, "Year", 1),
		metadata: { plan: "yearly" },
	},
	{
		env: "DODO_PRODUCT_TRIAL_PASS_ID",
		name: "HeadCV Pro 7-Day Pass",
		description: "7 days of every Pro tool for a one-time $3. Nothing renews and nothing is charged after.",
		price: oneTime(300),
		metadata: { plan: "trial_pass" },
	},
];

const client = new DodoPayments({ bearerToken: apiKey, environment });

const existing = new Map();
for await (const product of client.products.list()) {
	if (!existing.has(product.name)) existing.set(product.name, product.product_id);
}

console.log(`Environment: ${environment}${apply ? "" : " (dry run — add --apply to create)"}\n`);

const ids = {};
for (const product of PRODUCTS) {
	const found = existing.get(product.name);
	if (found) {
		console.log(`= exists   ${product.name} → ${found}`);
		ids[product.env] = found;
		continue;
	}
	if (!apply) {
		console.log(`+ would create ${product.name} ($${product.price.price / 100})`);
		continue;
	}
	const created = await client.products.create({
		name: product.name,
		description: product.description,
		tax_category: "saas",
		price: product.price,
		metadata: product.metadata,
	});
	console.log(`+ created  ${product.name} → ${created.product_id}`);
	ids[product.env] = created.product_id;
}

console.log("\nEnvironment variables:");
console.log(`DODO_PAYMENTS_ENVIRONMENT="${environment}"`);
for (const product of PRODUCTS) console.log(`${product.env}="${ids[product.env] ?? "<not created>"}"`);
