// @vitest-environment happy-dom

import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCheckout, useSubscription } from "./use-subscription";

const navigate = vi.hoisted(() => vi.fn());
const createCheckoutSession = vi.hoisted(() => vi.fn());
const subscription = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
const toastError = vi.hoisted(() => vi.fn());
const mockRouteContext = vi.hoisted(
	() => ({ session: { user: { id: "u1" } } }) as { session: { user: { id: string } } | null },
);

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigate,
	useRouteContext: () => ({ session: mockRouteContext.session }),
}));

vi.mock("@/libs/orpc/client", () => ({
	client: { billing: { createCheckoutSession: createCheckoutSession } },
	orpc: {
		billing: {
			getSubscription: {
				queryOptions: () => ({ queryKey: ["billing", "subscription"], queryFn: async () => subscription.current }),
			},
		},
	},
}));

vi.mock("sonner", () => ({
	toast: { error: toastError },
}));

describe("useCheckout", () => {
	beforeAll(() => {
		i18n.loadAndActivate({ locale: "en-US", messages: {} });
	});

	beforeEach(() => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		navigate.mockReset();
		createCheckoutSession.mockReset();
		toastError.mockReset();
		mockRouteContext.session = { user: { id: "u1" } };
		// Provide a stable location for navigation tests.
		Object.defineProperty(window, "location", {
			writable: true,
			value: { href: "" },
		});
	});

	it("redirects anonymous users to login with the selected plan", async () => {
		mockRouteContext.session = null;

		const { result } = renderHook(() => useCheckout());
		await act(async () => result.current.checkout("monthly"));

		expect(navigate).toHaveBeenCalledWith({ to: "/auth/login", search: { plan: "monthly" } });
		expect(result.current.isLoading).toBe(false);
	});

	it("sets loading while waiting for the checkout session", async () => {
		createCheckoutSession.mockImplementation(() => new Promise(() => {}));

		const { result } = renderHook(() => useCheckout());
		act(() => void result.current.checkout("monthly"));

		await waitFor(() => expect(result.current.isLoading).toBe(true));
	});

	it("navigates to the returned checkout URL and clears loading", async () => {
		createCheckoutSession.mockResolvedValue({ checkoutUrl: "https://checkout.dodopayments.com/s/abc" });

		const { result } = renderHook(() => useCheckout());
		await act(async () => result.current.checkout("monthly"));

		expect(window.location.href).toBe("https://checkout.dodopayments.com/s/abc");
	});

	it("shows an error and stops loading when checkout session creation fails", async () => {
		createCheckoutSession.mockRejectedValue(new Error("network"));

		const { result } = renderHook(() => useCheckout());
		await act(async () => result.current.checkout("monthly"));

		expect(result.current.isLoading).toBe(false);
		expect(toastError).toHaveBeenCalledWith("Could not start checkout. Please try again.");
	});

	it("asks for the trial on the plan the user chose, and buys outright otherwise", async () => {
		createCheckoutSession.mockResolvedValue({ checkoutUrl: "https://checkout.dodopayments.com/s/abc" });

		const { result } = renderHook(() => useCheckout());
		await act(async () => result.current.checkout("yearly-trial"));
		expect(createCheckoutSession).toHaveBeenLastCalledWith({ plan: "yearly", trial: true });

		await act(async () => result.current.checkout("monthly"));
		expect(createCheckoutSession).toHaveBeenLastCalledWith({ plan: "monthly", trial: false });
	});

	it("shows a specific error for an already-used trial", async () => {
		const { ORPCError } = await import("@orpc/client");
		createCheckoutSession.mockRejectedValue(new ORPCError("TRIAL_ALREADY_USED", { message: "Trial used" }));

		const { result } = renderHook(() => useCheckout());
		await act(async () => result.current.checkout("monthly-trial"));

		expect(toastError).toHaveBeenCalledWith(
			"You've already used your 7-day trial. Choose monthly or yearly to keep going.",
		);
	});

	it("points users who already pay to their plan instead of a second checkout", async () => {
		const { ORPCError } = await import("@orpc/client");
		createCheckoutSession.mockRejectedValue(new ORPCError("ALREADY_SUBSCRIBED", { message: "Already Pro" }));

		const { result } = renderHook(() => useCheckout());
		await act(async () => result.current.checkout("yearly"));

		expect(toastError).toHaveBeenCalledWith("You already have Pro. Manage your plan in billing settings.");
	});

	it("resets loading after the redirect timeout if navigation never happens", async () => {
		createCheckoutSession.mockImplementation(() => new Promise(() => {}));

		const { result } = renderHook(() => useCheckout());
		act(() => void result.current.checkout("monthly"));
		await waitFor(() => expect(result.current.isLoading).toBe(true));

		act(() => vi.advanceTimersByTime(10_000));

		await waitFor(() => expect(result.current.isLoading).toBe(false));
	});

	it("resets loading when the browser restores the page from bfcache", async () => {
		createCheckoutSession.mockResolvedValue({ checkoutUrl: "https://checkout.dodopayments.com/s/abc" });

		const { result } = renderHook(() => useCheckout());
		await act(async () => result.current.checkout("monthly"));

		// Simulate returning via the browser back button (bfcache).
		act(() => {
			const event = new Event("pageshow", { bubbles: true }) as PageTransitionEvent;
			Object.defineProperty(event, "persisted", { value: true });
			window.dispatchEvent(event);
		});

		await waitFor(() => expect(result.current.isLoading).toBe(false));
	});
});

describe("useSubscription", () => {
	const DAY = 24 * 60 * 60 * 1000;
	const usage = { resumesUsed: 0, resumesLimit: -1, aiChatsUsed: 0, aiChatsLimit: -1 };

	const renderSubscription = async (data: Record<string, unknown>) => {
		subscription.current = { usage, trialEligible: false, trialEndsAt: null, ...data };
		const queryClient = new QueryClient();
		const { result } = renderHook(() => useSubscription(), {
			wrapper: ({ children }: { children: ReactNode }) => (
				<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
			),
		});
		await waitFor(() => expect(result.current.sub).toBeDefined());
		return result.current;
	};

	it("shows a running trial on the plan it turns into, without offering another plan", async () => {
		const state = await renderSubscription({
			plan: "yearly",
			effectiveAccess: "paid",
			trialEndsAt: new Date(Date.now() + 3.5 * DAY).toISOString(),
		});
		expect(state).toMatchObject({ isPaid: true, isTrial: true, trialDaysLeft: 4, showUpgrade: false });
	});

	it("treats a converted trial as the plan itself", async () => {
		const state = await renderSubscription({ plan: "monthly", effectiveAccess: "paid" });
		expect(state).toMatchObject({ isPaid: true, isTrial: false, trialDaysLeft: null, showUpgrade: false });
	});

	it("offers an upgrade only to users without Pro", async () => {
		const state = await renderSubscription({ plan: "free", effectiveAccess: "free", trialEligible: true });
		expect(state).toMatchObject({ isPaid: false, isTrial: false, showUpgrade: true, trialEligible: true });
	});
});
