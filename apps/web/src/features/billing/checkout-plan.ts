import { t } from "@lingui/core/macro";
import { ORPCError } from "@orpc/client";

/**
 * What a checkout button or plan link asks for. "trial" is the one-time $3 pass: 7 days of Pro, nothing renews.
 * Kept as one string so it survives the login redirect (`?plan=`) and sessionStorage unchanged.
 */
export const CHECKOUT_PLANS = ["monthly", "yearly", "trial"] as const;

export type CheckoutPlan = (typeof CHECKOUT_PLANS)[number];

export const isCheckoutPlan = (value: unknown): value is CheckoutPlan => CHECKOUT_PLANS.includes(value as CheckoutPlan);

/** The message for a checkout the server refused on purpose, or null for an unexpected failure. */
export function checkoutErrorMessage(error: unknown): string | null {
	if (!(error instanceof ORPCError)) return null;
	if (error.code === "TRIAL_ALREADY_USED")
		return t`You've already used your 7-day trial. Choose monthly or yearly to keep going.`;
	if (error.code === "ALREADY_SUBSCRIBED") return t`You already have Pro. Manage your plan in billing settings.`;
	return null;
}

export const planLabel = (plan: string) => (plan === "yearly" ? t`Pro Yearly` : t`Pro Monthly`);
