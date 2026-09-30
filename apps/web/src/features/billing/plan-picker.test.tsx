// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { PlanPicker } from "./plan-picker";

vi.mock("./use-subscription", () => ({
	useCheckout: () => ({ checkout: vi.fn(), pendingPlan: null, isLoading: false }),
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
});
