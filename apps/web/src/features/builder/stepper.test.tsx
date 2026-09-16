// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { isStepComplete } from "./steps";

const onStepClick = vi.fn();

vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => ({
		data: { sections: { skills: { items: [] } } },
	}),
	useUpdateResumeData: () => vi.fn(),
}));
vi.mock("@/hooks/use-mobile", () => ({
	useIsMobile: () => false,
}));

const { BuilderStepper } = await import("./stepper");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

describe("BuilderStepper", () => {
	it("renders all 13 steps", () => {
		render(
			<I18nProvider i18n={i18n}>
				<BuilderStepper currentStep="personal-details" onStepClick={onStepClick} />
			</I18nProvider>,
		);

		expect(screen.getByRole("button", { name: /Personal Details/i })).toHaveAttribute("aria-current", "step");
		expect(screen.getAllByRole("button")).toHaveLength(13);
	});

	it("calls onStepClick when a step is clicked", async () => {
		render(
			<I18nProvider i18n={i18n}>
				<BuilderStepper currentStep="personal-details" onStepClick={onStepClick} />
			</I18nProvider>,
		);

		await userEvent.click(screen.getByRole("button", { name: /Work Experience/i }));
		expect(onStepClick).toHaveBeenCalledWith("work-experience");
	});

	it("does not mark workflow steps complete before the user reaches them", () => {
		const resume = { data: { metadata: { completedSteps: [] } } } as unknown as Parameters<typeof isStepComplete>[1];

		expect(isStepComplete("additional-sections", resume)).toBe(false);
		expect(isStepComplete("review", resume)).toBe(false);
		expect(isStepComplete("design", resume)).toBe(false);
		expect(isStepComplete("export", resume)).toBe(false);
		expect(isStepComplete("save-account", resume)).toBe(false);
		expect(
			isStepComplete("review", {
				data: { metadata: { completedSteps: ["review"] } },
			} as unknown as Parameters<typeof isStepComplete>[1]),
		).toBe(true);
	});
});
