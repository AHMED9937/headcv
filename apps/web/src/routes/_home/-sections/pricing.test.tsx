// @vitest-environment happy-dom

import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { Pricing } from "./pricing";

const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => (
		<a {...props} href={to}>
			{children}
		</a>
	),
	useNavigate: () => navigateMock,
	useRouteContext: () => ({ session: null }),
}));

vi.mock("@/libs/orpc/client", () => ({
	client: {
		billing: {
			createCheckoutSession: vi.fn().mockResolvedValue({ checkoutUrl: "https://test.dodopayments.com/checkout" }),
		},
	},
}));

const subscription = vi.hoisted(() => ({ trialEligible: true }));

vi.mock("@/features/billing/use-subscription", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/features/billing/use-subscription")>()),
	useSubscription: () => subscription,
	useLocalizedPricing: () => ({ currency: "USD", rate: 1 }),
}));

afterEach(() => {
	cleanup();
	subscription.trialEligible = true;
});

function renderPricing() {
	i18n.loadAndActivate({ locale: "en-US", messages: {} });
	return render(
		<I18nProvider i18n={i18n}>
			<Pricing />
		</I18nProvider>,
	);
}

const tab = (name: RegExp) => screen.getByRole("button", { name });

describe("Landing pricing", () => {
	it("offers the trial as a third tab beside Yearly and Monthly, with no separate banner", () => {
		renderPricing();
		const periods = within(screen.getByRole("group", { name: "Billing period" }));

		expect(periods.getAllByRole("button").map((button) => button.textContent)).toEqual([
			"YearlySave 75%",
			"Monthly",
			"7-day trial",
		]);
		expect(screen.queryByText("Try all of Pro.")).not.toBeInTheDocument();
	});

	it("shows the trial as a one-time $3 with no auto-renewal, and starts it from the Pro button", () => {
		renderPricing();
		fireEvent.click(tab(/^7-day trial$/));

		expect(tab(/^7-day trial$/)).toHaveAttribute("aria-pressed", "true");
		expect(screen.getByText("$3")).toBeInTheDocument();
		expect(screen.getByText("one-time")).toBeInTheDocument();
		expect(screen.getByText(/No auto-renewal/)).toHaveTextContent(
			"7 days of every Pro tool. No auto-renewal: nothing is charged after.",
		);

		fireEvent.click(screen.getByRole("button", { name: "Start 7-day trial" }));
		expect(navigateMock).toHaveBeenLastCalledWith({ to: "/auth/login", search: { plan: "trial" } });
	});

	it("describes the Free and Pro plans without cover-letter benefits", () => {
		renderPricing();
		expect(screen.getByText("Everything you need for a professional resume:")).toBeInTheDocument();
		expect(screen.getByText("Includes all Free features, plus:")).toBeInTheDocument();
		expect(screen.getByText("3 resumes")).toBeInTheDocument();
		expect(screen.getByText("Full design customization")).toBeInTheDocument();
		expect(screen.queryByText(/cover letter/i)).not.toBeInTheDocument();
	});

	it("hides the trial tab from users who already used it", () => {
		subscription.trialEligible = false;
		renderPricing();
		expect(screen.queryByRole("button", { name: /7-day trial/ })).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Get Pro" })).toBeInTheDocument();
	});

	it("starts on Yearly and switches billing periods with the tabs", () => {
		renderPricing();
		expect(tab(/Yearly/)).toHaveAttribute("aria-pressed", "true");
		expect(screen.getByText("$5")).toBeInTheDocument();

		fireEvent.click(tab(/Monthly/));
		expect(tab(/Monthly/)).toHaveAttribute("aria-pressed", "true");
		expect(tab(/Yearly/)).toHaveAttribute("aria-pressed", "false");
		expect(screen.getAllByText("$20").length).toBeGreaterThan(0);
	});

	it("redirects unauthenticated user to login with plan when clicking Get Pro", () => {
		renderPricing();
		fireEvent.click(screen.getByRole("button", { name: "Get Pro" }));
		expect(navigateMock).toHaveBeenCalledWith({ to: "/auth/login", search: { plan: "yearly" } });
	});
});
