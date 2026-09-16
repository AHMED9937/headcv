// @vitest-environment happy-dom

import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { Pricing } from "./pricing";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => (
		<a {...props} href={to}>
			{children}
		</a>
	),
}));

afterEach(cleanup);

function renderPricing() {
	i18n.loadAndActivate({ locale: "en-US", messages: {} });
	return render(
		<I18nProvider i18n={i18n}>
			<Pricing />
		</I18nProvider>,
	);
}

describe("Landing pricing", () => {
	it("shows the compact $3 trial after the plans without repeated duration or arrows", () => {
		renderPricing();
		const trial = screen.getByRole("region", { name: "Try all of Pro." });
		expect(within(trial).getByText("$3")).toBeInTheDocument();
		expect(within(trial).getByText("7-day trial")).toBeInTheDocument();
		expect(trial.textContent).not.toMatch(/US|for 7 days|→/);
		expect(
			screen.getByRole("heading", { name: "Pro" }).compareDocumentPosition(trial) & Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
		expect(within(trial).getByRole("button", { name: "Coming soon" })).toBeDisabled();
	});

	it("preserves the subscription billing toggle", () => {
		renderPricing();
		expect(screen.getByText("$5")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Monthly" }));
		expect(screen.getByText("$20")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Monthly" })).toHaveAttribute("aria-pressed", "true");
	});
});
