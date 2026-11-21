// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { PlanPicker } from "./plan-picker";

const checkout = vi.hoisted(() => vi.fn());

vi.mock("./use-subscription", () => ({
	useCheckout: () => ({ checkout, pendingPlan: null, isLoading: false }),
	useLocalizedPricing: () => ({ currency: "USD", rate: 1 }),
}));

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en-US", messages: {} });
});

const renderPicker = (props: { hideTrial?: boolean } = {}) =>
	render(
		<I18nProvider i18n={i18n}>
			<PlanPicker {...props} />
		</I18nProvider>,
	);

const tab = (name: RegExp) => screen.getByRole("button", { name });

describe("PlanPicker", () => {
	it("describes benefits without cover letters and offers no separate trial banner", () => {
		renderPicker();
		expect(screen.getByText("Includes all Free features, plus:")).toBeInTheDocument();
		expect(screen.getByText("Unlimited resumes")).toBeInTheDocument();
		expect(screen.getByText("Unlimited imports")).toBeInTheDocument();
		expect(screen.queryByText(/cover letter/i)).not.toBeInTheDocument();
		expect(screen.queryByText("Try all of Pro.")).not.toBeInTheDocument();
	});

	it("sells the 7-day trial from its own tab as a one-time $3 with no auto-renewal", () => {
		renderPicker();
		fireEvent.click(tab(/7-day trial/));

		expect(screen.getByText("$3")).toBeInTheDocument();
		expect(screen.getByText("one-time")).toBeInTheDocument();
		expect(screen.getByText(/No auto-renewal/)).toHaveTextContent(
			"7 days of every Pro tool. No auto-renewal: nothing is charged after.",
		);
		fireEvent.click(screen.getByRole("button", { name: "Start 7-day trial" }));
		expect(checkout).toHaveBeenLastCalledWith("trial");
	});

	it("buys the selected plan from Get Pro", () => {
		renderPicker();
		fireEvent.click(screen.getByRole("button", { name: "Get Pro" }));
		expect(checkout).toHaveBeenLastCalledWith("yearly");

		fireEvent.click(tab(/Monthly/));
		fireEvent.click(screen.getByRole("button", { name: "Get Pro" }));
		expect(checkout).toHaveBeenLastCalledWith("monthly");
	});

	it("drops the trial tab once the trial is used", () => {
		renderPicker({ hideTrial: true });
		expect(screen.queryByRole("button", { name: /7-day trial/ })).not.toBeInTheDocument();
	});
});
