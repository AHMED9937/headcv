/**
 * Verifies Dodo adaptive-currency conversion for our target (Arab + a few more) markets.
 *
 * Non-mutating: calls only `checkoutSessions.preview`, which creates no charge and no
 * session. Safe to run against live keys. Requires adaptive currency to be ENABLED in the
 * Dodo dashboard for the key's environment — otherwise `billing_currency` is ignored and
 * every row comes back at rate 1 (the script flags that as a failure).
 *
 *   DODO_PAYMENTS_API_KEY=... DODO_PAYMENTS_ENVIRONMENT=live_mode \
 *   DODO_PRODUCT_MONTHLY_ID=pdt_... node scripts/verify-adaptive-currency.mjs
 */
import DodoPayments from "dodopayments";

const apiKey = process.env.DODO_PAYMENTS_API_KEY;
const environment = process.env.DODO_PAYMENTS_ENVIRONMENT;
const productId =
	process.env.DODO_PRODUCT_MONTHLY_ID ?? process.env.DODO_PRODUCT_YEARLY_ID ?? process.env.DODO_PRODUCT_TRIAL_ID;

if (!apiKey) throw new Error("Set DODO_PAYMENTS_API_KEY in the environment.");
if (environment !== "test_mode" && environment !== "live_mode") {
	throw new Error('Set DODO_PAYMENTS_ENVIRONMENT to "test_mode" or "live_mode".');
}
if (!productId) throw new Error("Set DODO_PRODUCT_MONTHLY_ID (or YEARLY/TRIAL) to a product id.");

// country -> expected ISO-4217 (must match packages/api/src/features/billing/country-currency.ts).
// Focused on the Arab/MENA markets this work targets, plus JP (0-decimal canary) and GB/DE
// (majors). Expand to the full map only to re-audit Dodo currency support.
const CASES = [
	["EG", "EGP"],
	["SA", "SAR"],
	["AE", "AED"],
	["QA", "QAR"],
	["MA", "MAD"],
	["TR", "TRY"],
	["JP", "JPY"], // 0-decimal: guards the raw-amount (not scaled-rate) conversion check
	["GB", "GBP"],
	["DE", "EUR"],
];

const fractionDigits = (currency) => {
	try {
		return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
	} catch {
		return 2;
	}
};
const minorToMajor = (minor, currency) => minor / 10 ** fractionDigits(currency);

const client = new DodoPayments({ bearerToken: apiKey, environment });

console.log(`Environment: ${environment}  Product: ${productId}\n`);
console.log("country  currency  rate        status");
console.log("-------  --------  ----------  ------");

let failures = 0;
for (const [country, expected] of CASES) {
	try {
		const preview = await client.checkoutSessions.preview({
			product_cart: [{ product_id: productId, quantity: 1 }],
			billing_address: { country },
			billing_currency: expected,
		});
		const item = preview.product_cart?.[0];
		if (!item) {
			failures++;
			console.log(`${country}       ${expected}       -           FAIL (no cart item)`);
			continue;
		}
		const rate = minorToMajor(item.discounted_price, item.currency) / minorToMajor(item.og_price, item.og_currency);
		// "Converted" is raw-amount inequality, not rate !== 1: a 0-decimal echo (JPY) would
		// otherwise read as rate 100 and look converted when adaptive is actually off.
		const converted = item.discounted_price !== item.og_price;
		const ok = item.currency === expected && converted && Number.isFinite(rate) && rate > 0;
		if (!ok) failures++;
		const note =
			item.currency !== expected
				? `FAIL (got ${item.currency})`
				: !converted
					? "FAIL (unconverted — adaptive off?)"
					: "ok";
		console.log(`${country}       ${item.currency}       ${rate.toFixed(4).padEnd(10)}  ${note}`);
	} catch (error) {
		failures++;
		console.log(`${country}       ${expected}       -           ERROR (${error?.message ?? error})`);
	}
}

console.log(`\n${failures === 0 ? "✓ all markets converted" : `✗ ${failures} market(s) failed`}`);
process.exit(failures === 0 ? 0 : 1);
