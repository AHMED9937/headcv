// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { useDialogStore } from "@/dialogs/store";

const mocks = vi.hoisted(() => ({
	navigate: vi.fn(),
	search: {} as { section?: string; reviewSection?: string },
	hasReviewableChanges: false,
}));

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => mocks.navigate, useSearch: () => mocks.search }));

vi.mock("@/features/resume/builder/ai-assistant", () => ({
	useAiAssistant: () => ({ hasReviewableChanges: mocks.hasReviewableChanges }),
}));

vi.mock("@headcv/ui/components/scroll-area", () => ({
	ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("../-sidebar/left/sections/ai-review", () => ({
	AiReviewSectionBuilder: () => <div data-testid="ai-review-section" />,
}));

vi.mock("@/features/builder/use-builder-step", () => ({
	useBuilderStep: vi.fn(),
	getStepSectionId: vi.fn((stepId: string) => {
		switch (stepId) {
			case "personal-details":
				return "basics";
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
	vi.clearAllMocks();
	mocks.search = {};
	mocks.hasReviewableChanges = false;
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

	it("shows the AI review in place of the step when Review targets it", async () => {
		mockedUseBuilderStep.mockReturnValue({ currentStep: "work-experience" });
		mocks.search = { section: "ai-review", reviewSection: "summary" };
		mocks.hasReviewableChanges = true;

		render(
			<I18nProvider i18n={i18n}>
				<GuidedEditor />
			</I18nProvider>,
		);

		expect(screen.getByTestId("ai-review-section")).toBeInTheDocument();
		expect(screen.queryByTestId("builder-sidebar-left")).not.toBeInTheDocument();

		await userEvent.click(screen.getByRole("button", { name: "Back to step" }));
		const { search } = mocks.navigate.mock.calls[0][0];
		expect(search({ step: "work-experience", mode: "create", section: "ai-review", reviewSection: "summary" })).toEqual(
			{ step: "work-experience", mode: "create", section: undefined, reviewSection: undefined },
		);
	});

	it("keeps showing the step once there is nothing left to review", () => {
		mockedUseBuilderStep.mockReturnValue({ currentStep: "work-experience" });
		mocks.search = { section: "ai-review" };

		render(
			<I18nProvider i18n={i18n}>
				<GuidedEditor />
			</I18nProvider>,
		);

		expect(screen.getByTestId("builder-sidebar-left")).toBeInTheDocument();
		expect(screen.queryByTestId("ai-review-section")).not.toBeInTheDocument();
	});
});
