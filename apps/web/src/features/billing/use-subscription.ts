import { t } from "@lingui/core/macro";
import { ORPCError } from "@orpc/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { client, orpc } from "@/libs/orpc/client";

export type CheckoutPlan = "monthly" | "yearly" | "trial";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Share of a limited quota at which usage meters start warning. */
export const NEAR_LIMIT_RATIO = 0.8;

export const usageRatio = (used: number, limit: number) => (limit <= 0 ? 0 : Math.min(1, used / limit));

/** Single cached source of the signed-in user's plan, status and usage. */
export function useSubscription({ enabled = true }: { enabled?: boolean } = {}) {
	const query = useQuery({ ...orpc.billing.getSubscription.queryOptions({ input: {} }), enabled, staleTime: 60_000 });
	const sub = query.data;

	const isPaid = sub?.effectiveAccess === "paid";
	const isTrial = isPaid && sub?.plan === "trial";
	const trialDaysLeft =
		isTrial && sub?.currentPeriodEnd
			? Math.max(0, Math.ceil((new Date(sub.currentPeriodEnd).getTime() - Date.now()) / DAY_MS))
			: null;
	const nearLimit =
		!!sub &&
		!isPaid &&
		(usageRatio(sub.usage.aiChatsUsed, sub.usage.aiChatsLimit) >= NEAR_LIMIT_RATIO ||
			usageRatio(sub.usage.resumesUsed, sub.usage.resumesLimit) >= NEAR_LIMIT_RATIO);

	return {
		...query,
		sub,
		isPaid,
		isTrial,
		trialDaysLeft,
		nearLimit,
		// Unknown (loading or signed out) stays eligible; the server enforces the rule.
		trialEligible: sub?.trialEligible ?? true,
		showUpgrade: !!sub && (!isPaid || isTrial),
	};
}

/** Starts checkout; anonymous visitors are sent to login with the plan intent preserved. */
export function useCheckout() {
	const [pendingPlan, setPendingPlan] = useState<CheckoutPlan | null>(null);
	const navigate = useNavigate();
	const { session } = useRouteContext({ strict: false });

	const checkout = async (plan: CheckoutPlan) => {
		if (!session) {
			void navigate({ to: "/auth/login", search: { plan } });
			return;
		}

		setPendingPlan(plan);
		try {
			const result = await client.billing.createCheckoutSession({ plan });
			window.location.href = result.checkoutUrl;
		} catch (error) {
			setPendingPlan(null);
			toast.error(
				error instanceof ORPCError && error.code === "TRIAL_ALREADY_USED"
					? t`You've already used your 7-day trial. Choose monthly or yearly to keep going.`
					: t`Could not start checkout. Please try again.`,
			);
		}
	};

	return { checkout, pendingPlan, isLoading: pendingPlan !== null };
}
