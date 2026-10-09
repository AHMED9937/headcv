import { t } from "@lingui/core/macro";
import { ORPCError } from "@orpc/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { client, orpc } from "@/libs/orpc/client";

const CHECKOUT_REDIRECT_TIMEOUT_MS = 10_000;

export type CheckoutPlan = "monthly" | "yearly" | "trial";

export type LocalizedPricing = { currency: string; rate: number };
const USD_PRICING: LocalizedPricing = { currency: "USD", rate: 1 };

/**
 * The visitor's adaptive-currency pricing: the currency to display and the USD→local
 * multiplier. Falls back to USD while loading or on any error, so prices always render.
 */
export function useLocalizedPricing(): LocalizedPricing {
	const { data } = useQuery({
		...orpc.billing.getLocalizedPricing.queryOptions({ input: {} }),
		staleTime: 60 * 60 * 1000,
	});
	return data ?? USD_PRICING;
}

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
	const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const navigate = useNavigate();
	const { session } = useRouteContext({ strict: false });

	useEffect(() => {
		// When the user returns via the browser back button, some browsers restore the page
		// from the back-forward cache (bfcache) with the previous loading state still set.
		// Reset it so buttons don't stay stuck on "Redirecting to checkout...".
		const handlePageShow = (event: PageTransitionEvent) => {
			if (event.persisted) setPendingPlan(null);
		};
		window.addEventListener("pageshow", handlePageShow);
		return () => window.removeEventListener("pageshow", handlePageShow);
	}, []);

	const checkout = async (plan: CheckoutPlan) => {
		if (!session) {
			void navigate({ to: "/auth/login", search: { plan } });
			return;
		}

		setPendingPlan(plan);
		redirectTimeoutRef.current = setTimeout(() => setPendingPlan(null), CHECKOUT_REDIRECT_TIMEOUT_MS);

		try {
			const result = await client.billing.createCheckoutSession({ plan });
			if (redirectTimeoutRef.current) {
				clearTimeout(redirectTimeoutRef.current);
				redirectTimeoutRef.current = null;
			}
			if (!result.checkoutUrl) throw new Error("Missing checkout URL");
			window.location.href = result.checkoutUrl;
		} catch (error) {
			if (redirectTimeoutRef.current) {
				clearTimeout(redirectTimeoutRef.current);
				redirectTimeoutRef.current = null;
			}
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
