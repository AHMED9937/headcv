import type { CheckoutPlan } from "./checkout-plan";
import { t } from "@lingui/core/macro";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { client, orpc } from "@/libs/orpc/client";
import { checkoutErrorMessage } from "./checkout-plan";

export type { CheckoutPlan } from "./checkout-plan";

const CHECKOUT_REDIRECT_TIMEOUT_MS = 10_000;

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
	// The server reports a trial end only while a trial is running.
	const isTrial = isPaid && !!sub?.trialEndsAt;
	const trialDaysLeft =
		isTrial && sub?.trialEndsAt
			? Math.max(0, Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / DAY_MS))
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
		// Subscribers change plans in the portal (a second checkout would double-bill). The one-time trial pass
		// never renews, so its holders may pick a plan to keep Pro.
		showUpgrade: !!sub && (!isPaid || sub.plan === "trial_pass"),
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
			toast.error(checkoutErrorMessage(error) ?? t`Could not start checkout. Please try again.`);
		}
	};

	return { checkout, pendingPlan, isLoading: pendingPlan !== null };
}
