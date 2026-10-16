// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultResumeData } from "@headcv/schema/resume/default";

const state = vi.hoisted(() => ({
	data: null as unknown,
	currentStep: "additional-sections",
}));

vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => ({ data: state.data }),
}));
vi.mock("@/features/builder/use-builder-step", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/features/builder/use-builder-step")>()),
	useBuilderStep: () => ({ currentStep: state.currentStep }),
}));
vi.mock("@/features/builder/step-actions", () => ({ BuilderStepActions: () => null }));
vi.mock("../../-store/section", () => ({
	useSectionStore: (selector: (state: { expandLeftSection: () => void }) => unknown) =>
		selector({ expandLeftSection: vi.fn() }),
}));
vi.mock("./section-components", () => ({
	getSectionComponent: (section: string) => <div data-testid={`section-${section}`} />,
}));

const { BuilderSidebarLeft } = await import(".");

beforeEach(() => {
	const data = structuredClone(defaultResumeData);
	data.sections.projects.hidden = false;
	data.sections.projects.items = [{ id: "project-1", name: "HeadCV" } as never];
	data.sections.languages.hidden = true;
	data.sections.languages.items = [{ id: "language-1", language: "Arabic" } as never];
	state.data = data;
	state.currentStep = "additional-sections";
});

describe("BuilderSidebarLeft guided additional sections", () => {
	it("renders newly added optional sections with their canonical editors", () => {
		render(<BuilderSidebarLeft guided />);

		expect(screen.getByTestId("section-custom")).toBeInTheDocument();
		expect(screen.getByTestId("section-projects")).toBeInTheDocument();
		expect(screen.queryByTestId("section-languages")).not.toBeInTheDocument();
	});
});
