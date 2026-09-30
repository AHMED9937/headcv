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

describe("Landing pricing", () => {
	it("shows the compact $3 trial before the plans without repeated duration or arrows", () => {
		renderPricing();
		const trial = screen.getByRole("region", { name: "Try all of Pro." });
		expect(within(trial).getByText("$3")).toBeInTheDocument();
		expect(within(trial).getByText("7-day trial")).toBeInTheDocument();
		expect(trial.textContent).not.toMatch(/US|for 7 days|→/);
		expect(
			trial.compareDocumentPosition(screen.getByRole("heading", { name: "Pro" })) & Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
		expect(within(trial).getByRole("button", { name: "Start 7-day trial" })).toBeInTheDocument();
	});

	it("describes the Free and Pro plans without cover-letter benefits", () => {
		renderPricing();
		expect(screen.getByText("Everything you need for a professional resume:")).toBeInTheDocument();
		expect(screen.getByText("Includes all Free features, plus:")).toBeInTheDocument();
		expect(screen.getByText("Full design customization")).toBeInTheDocument();
		expect(screen.queryByText(/cover letter/i)).not.toBeInTheDocument();
	});

	it("hides the trial offer from users who already used it", () => {
		subscription.trialEligible = false;
		renderPricing();
		expect(screen.queryByRole("region", { name: "Try all of Pro." })).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Get Pro" })).toBeInTheDocument();
	});

	it("preserves the subscription billing toggle", () => {
		renderPricing();
		expect(screen.getByText("$5")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Monthly" }));
		expect(screen.getByText("$20")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Monthly" })).toHaveAttribute("aria-pressed", "true");
	});

	it("redirects unauthenticated user to login with plan when clicking Get Pro", () => {
		renderPricing();
		fireEvent.click(screen.getByRole("button", { name: "Get Pro" }));
		expect(navigateMock).toHaveBeenCalledWith({ to: "/auth/login", search: { plan: "yearly" } });
	});

	it("redirects unauthenticated user to login with trial plan", () => {
		renderPricing();
		fireEvent.click(screen.getByRole("button", { name: "Start 7-day trial" }));
		expect(navigateMock).toHaveBeenCalledWith({ to: "/auth/login", search: { plan: "trial" } });
	});
});
