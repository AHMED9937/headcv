// @vitest-environment happy-dom

import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { ORPCError } from "@orpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mocks = vi.hoisted(() => ({ verify: vi.fn(), search: {} as { status?: string } }));

vi.mock("@/libs/orpc/client", () => ({
	client: { billing: { verifyAndActivate: mocks.verify } },
	orpc: { billing: { getSubscription: { key: () => ["billing", "getSubscription"] } } },
}));

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: () => (options: Record<string, unknown>) => ({ ...options, useSearch: () => mocks.search }),
	Link: ({ to, children }: { to: string; children?: ReactNode }) => <a href={to}>{children}</a>,
}));

const { Route } = await import("./success");
const CheckoutSuccess = (Route as unknown as { component: () => ReactNode }).component;

beforeAll(() => i18n.loadAndActivate({ locale: "en", messages: {} }));

beforeEach(() => {
	mocks.verify.mockReset();
	mocks.search = { status: "active" };
});

function renderPage() {
	return render(
		<QueryClientProvider client={new QueryClient()}>
			<I18nProvider i18n={i18n}>
				<CheckoutSuccess />
			</I18nProvider>
		</QueryClientProvider>,
	);
}

describe("Checkout success page", () => {
	it("shows progress immediately, then the activated plan", async () => {
		mocks.verify.mockResolvedValue({ activated: true, plan: "yearly", status: "active", trial: false });
		renderPage();

		expect(screen.getByRole("heading", { name: "Verifying payment..." })).toBeInTheDocument();
		expect(await screen.findByRole("heading", { name: "Welcome to Pro!" })).toBeInTheDocument();
		expect(screen.getByText(/Your Pro Yearly plan is active/)).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Go to Dashboard" })).toHaveAttribute("href", "/dashboard");
	});

	it("confirms a started trial and the plan it turns into", async () => {
		mocks.verify.mockResolvedValue({ activated: true, plan: "monthly", status: "active", trial: true });
		renderPage();

		expect(
			await screen.findByText(
				/Your 7-day Pro trial has started\. It continues as Pro Monthly unless you cancel before it ends\./,
			),
		).toBeInTheDocument();
	});

	it("keeps polling with a pending message while the payment is confirmed", async () => {
		mocks.verify.mockResolvedValue({ activated: false, plan: "free", status: "pending" });
		renderPage();

		expect(await screen.findByRole("heading", { name: "Almost there..." })).toBeInTheDocument();
	});

	it("shows a failure without polling when Dodo reports the payment failed", () => {
		mocks.search = { status: "failed" };
		renderPage();

		expect(screen.getByRole("heading", { name: "Payment not completed" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "See plans" })).toBeInTheDocument();
		expect(mocks.verify).not.toHaveBeenCalled();
	});

	it("asks signed-out visitors to sign in instead of retrying", async () => {
		mocks.verify.mockRejectedValue(new ORPCError("UNAUTHORIZED"));
		renderPage();

		expect(await screen.findByRole("heading", { name: "Sign in to finish" })).toBeInTheDocument();
		expect(mocks.verify).toHaveBeenCalledOnce();
	});

	it("announces status changes to assistive technology", () => {
		mocks.verify.mockReturnValue(new Promise(() => {}));
		renderPage();

		expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
	});
});
