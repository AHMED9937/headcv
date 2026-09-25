// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { useDialogStore } from "@/dialogs/store";

vi.mock("@/features/builder/use-builder-step", () => ({
	useBuilderStep: vi.fn(),
	getStepSectionId: vi.fn((stepId: string) => {
		switch (stepId) {
			case "personal-details":
				return "basics";
			case "profiles":
				return "profiles";
			case "work-experience":
				return "experience";
			case "education":
				return "education";
			case "skills":
				return "skills";
			case "summary":
				return "summary";
			case "additional-sections":
				return "custom";
			default:
				return null;
		}
	}),
}));

vi.mock("../-sidebar/left", () => ({
	BuilderSidebarLeft: ({ guided }: { guided?: boolean }) => (
		<div data-testid="builder-sidebar-left">guided={String(guided)}</div>
	),
}));

vi.mock("./inline-section-editor", () => ({
	InlineSectionEditor: () => <div data-testid="inline-section-editor" />,
}));

vi.mock("../-sidebar/right/sections/export", () => ({
	ExportSectionBuilder: () => <div data-testid="export-section-builder" />,
}));

const { useBuilderStep } = await import("@/features/builder/use-builder-step");
const { GuidedEditor } = await import("./guided-editor");

const mockedUseBuilderStep = useBuilderStep as unknown as ReturnType<typeof vi.fn>;

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

beforeEach(() => {
	useDialogStore.setState({ open: false, activeDialog: null, onBeforeClose: null, presentation: "modal" });
});

describe("GuidedEditor", () => {
	it("renders the sidebar for a section step when no inline dialog is active", () => {
		mockedUseBuilderStep.mockReturnValue({ currentStep: "work-experience" });

		render(
			<I18nProvider i18n={i18n}>
				<GuidedEditor />
			</I18nProvider>,
		);

		expect(screen.getByTestId("builder-sidebar-left")).toBeInTheDocument();
		expect(screen.queryByTestId("inline-section-editor")).not.toBeInTheDocument();
	});

	it("renders the inline editor when an inline section dialog is active", () => {
		mockedUseBuilderStep.mockReturnValue({ currentStep: "work-experience" });
		useDialogStore.setState({
			open: false,
			presentation: "inline",
			activeDialog: { type: "resume.sections.experience.create", data: undefined },
			onBeforeClose: null,
		});

		render(
			<I18nProvider i18n={i18n}>
				<GuidedEditor />
			</I18nProvider>,
		);

		expect(screen.getByTestId("inline-section-editor")).toBeInTheDocument();
		expect(screen.queryByTestId("builder-sidebar-left")).not.toBeInTheDocument();
	});

	it("renders the export step when the current step is export", () => {
		mockedUseBuilderStep.mockReturnValue({ currentStep: "export" });

		render(
			<I18nProvider i18n={i18n}>
				<GuidedEditor />
			</I18nProvider>,
		);

		expect(screen.getByTestId("export-section-builder")).toBeInTheDocument();
		expect(screen.queryByTestId("inline-section-editor")).not.toBeInTheDocument();
		expect(screen.queryByTestId("builder-sidebar-left")).not.toBeInTheDocument();
	});
});
