// @vitest-environment happy-dom

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { useCheckout } from "./use-subscription";

const navigate = vi.hoisted(() => vi.fn());
const createCheckoutSession = vi.hoisted(() => vi.fn());
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
	orpc: {},
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

	it("shows a specific error for an already-used trial", async () => {
		const { ORPCError } = await import("@orpc/client");
		createCheckoutSession.mockRejectedValue(new ORPCError("TRIAL_ALREADY_USED", { message: "Trial used" }));

		const { result } = renderHook(() => useCheckout());
		await act(async () => result.current.checkout("trial"));

		expect(toastError).toHaveBeenCalledWith(
			"You've already used your 7-day trial. Choose monthly or yearly to keep going.",
		);
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
