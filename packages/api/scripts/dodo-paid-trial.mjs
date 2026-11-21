/**
 * Moves HeadCV from the retired "$3 every 7 days" trial product to Dodo's native paid trial:
 * $3 for 7 days on the Monthly and Yearly prices, after which the plan the user chose bills automatically.
 *
 * Dry run (default) — reports what would change and touches nothing:
 *   DODO_PAYMENTS_API_KEY=... DODO_PAYMENTS_ENVIRONMENT=test_mode \
 *   DODO_PRODUCT_MONTHLY_ID=... DODO_PRODUCT_YEARLY_ID=... DODO_PRODUCT_TRIAL_ID=... \
 *   node scripts/dodo-paid-trial.mjs
 *
 * Step 1, right BEFORE deploying the app:  --set-trial
 *   Adds the paid trial to the Monthly and Yearly prices. Existing subscribers keep their terms:
 *   Dodo never reprices an existing subscription.
 * Step 2, right AFTER deploying the app:   --stop-legacy
 *   Schedules every live "$3 every 7 days" subscription to end at its next billing date. Users keep
 *   the week they paid for, then drop to Free; nothing is refunded. Safe to re-run (a day later, for
 *   checkouts that were already open during the deploy).
 *
 * Also enable "Prevent Trial Misuse" in the Dodo dashboard (Settings → Subscriptions); it has no API.
 */
import DodoPayments from "dodopayments";

const PAID_TRIAL = { trial_period_days: 7, trial_amount: 300 }; // $3.00, in cents

const {
	DODO_PAYMENTS_API_KEY: apiKey,
	DODO_PAYMENTS_ENVIRONMENT: environment,
	DODO_PRODUCT_MONTHLY_ID: monthlyId,
	DODO_PRODUCT_YEARLY_ID: yearlyId,
	DODO_PRODUCT_TRIAL_ID: legacyTrialId,
} = process.env;
const setTrial = process.argv.includes("--set-trial");
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
const hasPaidTrial = (price) =>
	price.trial_period_days === PAID_TRIAL.trial_period_days && price.trial_amount === PAID_TRIAL.trial_amount;

console.log(`Environment: ${environment}${setTrial || stopLegacy ? "" : " (dry run — nothing will change)"}\n`);

// --- Step 1: the paid trial on each plan's price -------------------------------------------------
for (const [plan, id] of [
	["Monthly", monthlyId],
	["Yearly", yearlyId],
]) {
	const { price } = await client.products.retrieve(id);
	if (price.type !== "recurring_price") throw new Error(`${plan} (${id}) is not a recurring price.`);
	const current = `trial ${price.trial_period_days ?? 0}d / $${(price.trial_amount ?? 0) / 100}`;

	if (hasPaidTrial(price)) {
		console.log(`= ${plan} ${id}: ${current} (already set)`);
		continue;
	}
	if (!setTrial) {
		console.log(`+ ${plan} ${id}: ${current} → trial 7d / $3 (run with --set-trial)`);
		continue;
	}

	await client.products.update(id, { price: { ...price, ...PAID_TRIAL } });
	const { price: updated } = await client.products.retrieve(id);
	if (!hasPaidTrial(updated) || updated.price !== price.price) {
		throw new Error(`${plan} (${id}) did not update as expected; check it in the Dodo dashboard.`);
	}
	console.log(`✓ ${plan} ${id}: trial 7d / $3 set (plan price unchanged: $${updated.price / 100})`);
}

// Prove both checkouts the app creates, using Dodo's read-only quote: a trial checkout (no override) must
// charge $3 today and bill the plan in 7 days; "Get Pro" (trial_period_days: 0) must charge the full plan.
let checkoutsOk = true;
for (const [plan, id] of [
	["Monthly", monthlyId],
	["Yearly", yearlyId],
]) {
	const { price } = await client.products.retrieve(id);
	if (!hasPaidTrial(price)) continue;
	const quote = (extra) =>
		client.checkoutSessions.preview({
			product_cart: [{ product_id: id, quantity: 1 }],
			billing_address: { country: "US" },
			...extra,
		});
	const trial = await quote({});
	const direct = await quote({ subscription_data: { trial_period_days: 0 } });
	const daysToBilling = Math.round((Date.parse(trial.next_billing_date ?? "") - Date.now()) / 86_400_000);
	const ok =
		trial.current_breakup.subtotal === PAID_TRIAL.trial_amount &&
		daysToBilling === PAID_TRIAL.trial_period_days &&
		direct.current_breakup.subtotal === price.price;
	checkoutsOk &&= ok;
	console.log(
		`${ok ? "✓" : "✗"} ${plan} checkouts: trial $${trial.current_breakup.subtotal / 100} today, plan billed in ${daysToBilling}d` +
			` · Get Pro $${direct.current_breakup.subtotal / 100} today`,
	);
}
if (!checkoutsOk)
	throw new Error("Checkout quotes do not match the paid trial. Do NOT deploy; check Dodo's trial settings.");

// --- Step 2: wind down the retired weekly product ------------------------------------------------
if (!legacyTrialId) {
	console.log("\nDODO_PRODUCT_TRIAL_ID not set — skipping the retired weekly trial.");
} else {
	const listByProduct = async (productId) => {
		const subs = [];
		for (const status of ["active", "on_hold"]) {
			for await (const sub of client.subscriptions.list({ product_id: productId, status })) subs.push(sub);
		}
		return subs;
	};

	const legacy = await listByProduct(legacyTrialId);
	const payingCustomers = new Set(
		[...(await listByProduct(monthlyId)), ...(await listByProduct(yearlyId))].map((s) => s.customer.customer_id),
	);

	console.log(`\nRetired weekly trial ${legacyTrialId}: ${legacy.length} live subscription(s)`);
	let scheduled = 0;
	for (const sub of legacy) {
		const alsoPaying = payingCustomers.has(sub.customer.customer_id) ? " · also pays Monthly/Yearly" : "";
		const line = `${sub.subscription_id} ${maskEmail(sub.customer.email)} ${sub.status} next ${sub.next_billing_date}${alsoPaying}`;

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
	if (stopLegacy) console.log(`\nScheduled ${scheduled} to end. Archive the retired product in the dashboard after.`);
}
