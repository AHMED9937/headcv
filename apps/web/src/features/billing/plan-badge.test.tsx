// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { useDialogStore } from "@/dialogs/store";
import { PlanBadge } from "./plan-badge";

const subscription = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));

vi.mock("./use-subscription", () => ({ useSubscription: () => subscription.current }));

vi.mock("@tanstack/react-router", () => ({
	Link: ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
		<a href={to} className={className}>
			{children}
		</a>
	),
}));

const sub = { plan: "free", usage: { aiChatsUsed: 0, aiChatsLimit: 3, resumesUsed: 0, resumesLimit: 3 } };

describe("PlanBadge", () => {
	beforeAll(() => {
		i18n.loadAndActivate({ locale: "en", messages: {} });
	});

	beforeEach(() => {
		useDialogStore.setState({ open: false, activeDialog: null });
	});

	it("shows the free plan and opens the upgrade dialog", async () => {
		subscription.current = { sub, isPaid: false, isTrial: false, trialDaysLeft: null, showUpgrade: true };
		render(<PlanBadge />, { wrapper: ({ children }) => <I18nProvider i18n={i18n}>{children}</I18nProvider> });

		expect(screen.getByRole("link", { name: "Free plan" })).toHaveAttribute("href", "/dashboard/settings/billing");
		await userEvent.setup().click(screen.getByRole("button", { name: "Upgrade" }));

		expect(useDialogStore.getState().activeDialog).toEqual({ type: "billing.upgrade", data: { reason: "badge" } });
	});

	it("shows the trial countdown with an upgrade button", () => {
		subscription.current = { sub, isPaid: true, isTrial: true, trialDaysLeft: 4, showUpgrade: true };
		render(<PlanBadge />, { wrapper: ({ children }) => <I18nProvider i18n={i18n}>{children}</I18nProvider> });

		expect(screen.getByRole("link", { name: "Trial · 4d left" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Upgrade" })).toBeInTheDocument();
	});

	it("shows Pro without an upgrade button for paid plans", () => {
		subscription.current = { sub, isPaid: true, isTrial: false, trialDaysLeft: null, showUpgrade: false };
		render(<PlanBadge />, { wrapper: ({ children }) => <I18nProvider i18n={i18n}>{children}</I18nProvider> });

		expect(screen.getByRole("link", { name: "Pro" })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Upgrade" })).not.toBeInTheDocument();
	});

	it("renders nothing until the subscription loads", () => {
		subscription.current = { sub: undefined, showUpgrade: false };
		const { container } = render(<PlanBadge />, {
			wrapper: ({ children }) => <I18nProvider i18n={i18n}>{children}</I18nProvider>,
		});

		expect(container).toBeEmptyDOMElement();
	});
});
