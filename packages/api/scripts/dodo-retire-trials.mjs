/**
 * Retires HeadCV's two earlier trial models now that the trial is a one-time $3 pass (its own product,
 * created by scripts/dodo-setup-products.mjs):
 *   - the paid trial on the Monthly and Yearly prices ($3 for 7 days, then the plan billed itself), and
 *   - the "$3 every 7 days" weekly subscription product.
 *
 * Dry run (default) — reports what would change and touches nothing:
 *   DODO_PAYMENTS_API_KEY=... DODO_PAYMENTS_ENVIRONMENT=test_mode \
 *   DODO_PRODUCT_MONTHLY_ID=... DODO_PRODUCT_YEARLY_ID=... DODO_PRODUCT_TRIAL_ID=<old weekly product> \
 *   node scripts/dodo-retire-trials.mjs
 *
 * --remove-plan-trial  Takes the trial off the Monthly and Yearly prices (the app already sends
 *                      trial_period_days: 0, so this is cleanup) and checks both now charge in full today.
 *                      Existing subscribers keep their terms: Dodo never reprices an existing subscription.
 * --stop-legacy        Schedules every live weekly-trial subscription to end at its next billing date. Users keep
 *                      the week they paid for, then drop to Free; nothing is refunded. Safe to re-run.
 */
import DodoPayments from "dodopayments";

const {
	DODO_PAYMENTS_API_KEY: apiKey,
	DODO_PAYMENTS_ENVIRONMENT: environment,
	DODO_PRODUCT_MONTHLY_ID: monthlyId,
	DODO_PRODUCT_YEARLY_ID: yearlyId,
	DODO_PRODUCT_TRIAL_ID: legacyTrialId,
} = process.env;
const removePlanTrial = process.argv.includes("--remove-plan-trial");
const stopLegacy = process.argv.includes("--stop-legacy");

if (!apiKey) throw new Error("Set DODO_PAYMENTS_API_KEY in the environment (never pass it as an argument).");
if (environment !== "test_mode" && environment !== "live_mode") {
	throw new Error('Set DODO_PAYMENTS_ENVIRONMENT to "test_mode" or "live_mode" explicitly.');
}
if (
	/^dodo_(live|test)_/.test(apiKey) &&
	!apiKey.startsWith(environment === "live_mode" ? "dodo_live_" : "dodo_test_")
) {
	throw new Error(`API key prefix does not match ${environment}.`);
}
if (!monthlyId || !yearlyId) throw new Error("Set DODO_PRODUCT_MONTHLY_ID and DODO_PRODUCT_YEARLY_ID.");

const client = new DodoPayments({ bearerToken: apiKey, environment });
const maskEmail = (email = "") => email.replace(/^(.).*(@.*)$/, "$1***$2");
const plans = [
	["Monthly", monthlyId],
	["Yearly", yearlyId],
];

console.log(`Environment: ${environment}${removePlanTrial || stopLegacy ? "" : " (dry run — nothing will change)"}\n`);

// --- The trial on the plan prices -----------------------------------------------------------------
for (const [plan, id] of plans) {
	const { price } = await client.products.retrieve(id);
	if (price.type !== "recurring_price") throw new Error(`${plan} (${id}) is not a recurring price.`);
	const days = price.trial_period_days ?? 0;

	if (days === 0) {
		console.log(`= ${plan} ${id}: no trial on the price`);
	} else if (!removePlanTrial) {
		console.log(`- ${plan} ${id}: trial ${days}d / $${(price.trial_amount ?? 0) / 100} (run with --remove-plan-trial)`);
	} else {
		await client.products.update(id, { price: { ...price, trial_period_days: 0, trial_amount: null } });
		const { price: updated } = await client.products.retrieve(id);
		if ((updated.trial_period_days ?? 0) !== 0 || updated.price !== price.price) {
			throw new Error(`${plan} (${id}) did not update as expected; check it in the Dodo dashboard.`);
		}
		console.log(`✓ ${plan} ${id}: trial removed (plan price unchanged: $${updated.price / 100})`);
	}

	// Dodo's read-only quote: a new Monthly/Yearly checkout must charge the full plan today.
	const quote = await client.checkoutSessions.preview({
		product_cart: [{ product_id: id, quantity: 1 }],
		billing_address: { country: "US" },
		subscription_data: { trial_period_days: 0 },
	});
	const today = quote.current_breakup.subtotal;
	console.log(`  ${today === price.price ? "✓" : "✗"} a new ${plan} checkout charges $${today / 100} today`);
}

// --- The retired weekly product ---------------------------------------------------------------------
if (!legacyTrialId) {
	console.log("\nDODO_PRODUCT_TRIAL_ID (the old weekly product) not set — skipping its subscriptions.");
} else {
	const legacy = [];
	for (const status of ["active", "on_hold"]) {
		for await (const sub of client.subscriptions.list({ product_id: legacyTrialId, status })) legacy.push(sub);
	}

	console.log(`\nRetired weekly trial ${legacyTrialId}: ${legacy.length} live subscription(s)`);
	let scheduled = 0;
	for (const sub of legacy) {
		const line = `${sub.subscription_id} ${maskEmail(sub.customer.email)} ${sub.status} next ${sub.next_billing_date}`;
		if (sub.cancel_at_next_billing_date) {
			console.log(`= ${line} (already ending)`);
		} else if (!stopLegacy) {
			console.log(`- ${line} (run with --stop-legacy)`);
		} else {
			await client.subscriptions.update(sub.subscription_id, { cancel_at_next_billing_date: true });
			scheduled += 1;
			console.log(`✓ ${line} → ends at next billing date`);
		}
	}
	if (stopLegacy)
		console.log(`\nScheduled ${scheduled} to end. Archive the old weekly product in the dashboard after.`);
}
