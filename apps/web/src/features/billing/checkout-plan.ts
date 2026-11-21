import { t } from "@lingui/core/macro";
import { ORPCError } from "@orpc/client";

/**
 * What a checkout button or plan link asks for: a billing period, optionally opening with the one-time
 * 7-day trial. One string so it survives the login redirect (`?plan=`) and sessionStorage unchanged.
 */
export const CHECKOUT_PLANS = ["monthly", "yearly", "monthly-trial", "yearly-trial"] as const;

export type CheckoutPlan = (typeof CHECKOUT_PLANS)[number];

export const isCheckoutPlan = (value: unknown): value is CheckoutPlan => CHECKOUT_PLANS.includes(value as CheckoutPlan);

/** The `createCheckoutSession` input: the plan that will be billed, and whether it opens with the trial. */
export const toCheckoutInput = (plan: CheckoutPlan) => ({
	plan: plan.startsWith("yearly") ? ("yearly" as const) : ("monthly" as const),
	trial: plan.endsWith("-trial"),
});

/** The message for a checkout the server refused on purpose, or null for an unexpected failure. */
export function checkoutErrorMessage(error: unknown): string | null {
	if (!(error instanceof ORPCError)) return null;
	if (error.code === "TRIAL_ALREADY_USED")
		return t`You've already used your 7-day trial. Choose monthly or yearly to keep going.`;
	if (error.code === "ALREADY_SUBSCRIBED") return t`You already have Pro. Manage your plan in billing settings.`;
	return null;
}

export const planLabel = (plan: string) => (plan === "yearly" ? t`Pro Yearly` : t`Pro Monthly`);
