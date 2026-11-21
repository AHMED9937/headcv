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

const renderPicker = () =>
	render(
		<I18nProvider i18n={i18n}>
			<PlanPicker />
		</I18nProvider>,
	);

describe("PlanPicker", () => {
	it("places the trial before Pro and describes benefits without cover letters", () => {
		renderPicker();
		const trialHeading = screen.getByText("Try all of Pro.");
		const proHeading = screen.getByText("Pro");
		expect(trialHeading.compareDocumentPosition(proHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(screen.getByText("Includes all Free features, plus:")).toBeInTheDocument();
		expect(screen.getByText("Unlimited resumes")).toBeInTheDocument();
		expect(screen.getByText("Unlimited imports")).toBeInTheDocument();
		expect(screen.queryByText(/cover letter/i)).not.toBeInTheDocument();
	});

	it("starts the trial on the selected billing period and says what it turns into", () => {
		renderPicker();
		const startTrial = screen.getByRole("button", { name: "Start 7-day trial" });
		const terms = () => screen.getByText(/Cancel anytime during the trial/);

		expect(terms()).toHaveTextContent("Then $60/year. Cancel anytime during the trial.");
		fireEvent.click(startTrial);
		expect(checkout).toHaveBeenLastCalledWith("yearly-trial");

		fireEvent.click(screen.getByRole("button", { name: "Monthly" }));
		expect(terms()).toHaveTextContent("Then $20/month. Cancel anytime during the trial.");
		fireEvent.click(startTrial);
		expect(checkout).toHaveBeenLastCalledWith("monthly-trial");
	});

	it("buys the selected plan outright from Get Pro", () => {
		renderPicker();
		fireEvent.click(screen.getByRole("button", { name: "Get Pro" }));
		expect(checkout).toHaveBeenLastCalledWith("yearly");
	});
});
