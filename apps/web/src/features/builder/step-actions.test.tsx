// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";

vi.mock("./use-builder-step", () => ({
	useBuilderStep: () => ({
		goBack: vi.fn(),
		goNext: vi.fn(),
		skipStep: vi.fn(),
		previousStep: "personal-details",
		nextStep: "education",
		isCurrentStepComplete: true,
		isCurrentStepSkipped: false,
	}),
}));

import { BuilderStepActions } from "./step-actions";

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

// happy-dom has no layout engine, so these guard the class contract that keeps Continue reachable.
describe("BuilderStepActions", () => {
	it("wraps instead of clipping Continue on narrow phones", () => {
		render(<BuilderStepActions />);
		const bar = screen.getByRole("button", { name: "Back" }).parentElement;
		const continueButton = screen.getByRole("button", { name: "Continue" });

		// Back + "Skip / Not applicable" + Continue need ~357px; a 360px phone leaves 328px.
		expect(bar).toHaveClass("flex-wrap");
		expect(continueButton.parentElement).toHaveClass("ms-auto", "flex-wrap");
	});

	it("asks the floating AI button to sit above it", () => {
		render(<BuilderStepActions />);
		expect(screen.getByRole("button", { name: "Back" }).parentElement).toHaveAttribute("data-fab-avoid");
	});
});
