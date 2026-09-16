// @vitest-environment happy-dom

import type { ComponentProps, ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

const aiAssistantMock = vi.hoisted(() => ({ hasReviewableChanges: false }));

const { getContentSectionComponent, getDesignSectionComponent, mobileState, setCollapsed } = vi.hoisted(() => ({
	getContentSectionComponent: vi.fn((section: string) => (
		<div data-testid={`content-section-${section}`}>{section}</div>
	)),
	getDesignSectionComponent: vi.fn((section: string) => <div data-testid={`design-section-${section}`}>{section}</div>),
	mobileState: { value: false },
	setCollapsed: vi.fn(),
}));

vi.mock("@headcv/ui/components/scroll-area", () => ({
	ScrollArea: ({ children, className }: { children: ReactNode; className?: string }) => (
		<div className={className}>{children}</div>
	),
}));
vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => ({
		data: {
			basics: { name: "", headline: "", email: "" },
			sections: { experience: { items: [] }, education: { items: [] } },
		},
	}),
}));
vi.mock("@/hooks/use-mobile", () => ({
	useIsMobile: () => mobileState.value,
}));
vi.mock("@/features/resume/builder/ai-assistant", () => ({
	useAiAssistant: () => aiAssistantMock,
}));
vi.mock("../-sidebar/left/section-components", () => ({
	getSectionComponent: getContentSectionComponent,
}));
vi.mock("../-sidebar/right/section-components", () => ({
	getSectionComponent: getDesignSectionComponent,
}));
vi.mock("../-sidebar/right/sections/export", () => ({
	ExportSectionBuilder: () => <div data-testid="export-section" />,
}));
vi.mock("../-store/section", () => ({
	useSectionStore: (selector: (state: { setCollapsed: typeof setCollapsed }) => unknown) => selector({ setCollapsed }),
}));

const { ImportedWorkspace } = await import("./imported-workspace");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

beforeEach(() => {
	mobileState.value = false;
	aiAssistantMock.hasReviewableChanges = false;
	setCollapsed.mockClear();
	getContentSectionComponent.mockClear();
	getDesignSectionComponent.mockClear();
});

const renderWorkspace = (overrides: Partial<ComponentProps<typeof ImportedWorkspace>> = {}) => {
	const props: ComponentProps<typeof ImportedWorkspace> = {
		tab: "design",
		section: "basics",
		designSection: "typography",
		isImported: false,
		onSectionChange: vi.fn(),
		onDesignSectionChange: vi.fn(),
		preview: <div data-testid="preview">Preview</div>,
		...overrides,
	};

	return {
		...render(
			<I18nProvider i18n={i18n}>
				<ImportedWorkspace {...props} />
			</I18nProvider>,
		),
		props,
	};
};

describe("ImportedWorkspace", () => {
	it("renders Design with the same section-navigation pattern as Content", async () => {
		const { props } = renderWorkspace({ isImported: true });
		const navigation = screen.getByRole("navigation", { name: "Design your resume" });
		const sectionButtons = within(navigation).getAllByRole("button");

		expect(sectionButtons.map((button) => button.textContent)).toEqual([
			"Template",
			"Design",
			"Typography",
			"Layout",
			"Page",
			"Notes",
		]);
		expect(within(navigation).getByRole("button", { name: "Typography" })).toHaveAttribute("aria-current", "page");
		expect(within(navigation).getByText("Imported")).toBeInTheDocument();
		expect(screen.getByTestId("design-section-typography")).toBeInTheDocument();
		expect(screen.queryByTestId("design-section-template")).not.toBeInTheDocument();
		expect(getDesignSectionComponent).toHaveBeenCalledTimes(1);
		expect(getDesignSectionComponent).toHaveBeenCalledWith("typography");

		await userEvent.click(within(navigation).getByRole("button", { name: "Layout" }));
		expect(props.onDesignSectionChange).toHaveBeenCalledWith("layout");
	});

	it("keeps Content on the shared navigation and mounts only its selected section", () => {
		renderWorkspace({ tab: "content", section: "experience" });

		expect(screen.getByRole("navigation", { name: "Resume content" })).toBeInTheDocument();
		expect(screen.getByTestId("content-section-experience")).toBeInTheDocument();
		expect(screen.queryByTestId("design-section-typography")).not.toBeInTheDocument();
		expect(getContentSectionComponent).toHaveBeenCalledTimes(1);
		expect(getContentSectionComponent).toHaveBeenCalledWith("experience");
	});

	it("expands the selected section whenever the active workspace changes", async () => {
		const view = renderWorkspace({ tab: "content", section: "summary" });

		await waitFor(() => expect(setCollapsed).toHaveBeenCalledWith("summary", false));

		view.rerender(
			<I18nProvider i18n={i18n}>
				<ImportedWorkspace {...view.props} tab="design" designSection="page" />
			</I18nProvider>,
		);

		await waitFor(() => expect(setCollapsed).toHaveBeenCalledWith("page", false));
	});

	it("changes Design categories through the compact selector", async () => {
		const { props } = renderWorkspace();

		await userEvent.selectOptions(screen.getByRole("combobox", { name: "Design your resume" }), "page");

		expect(props.onDesignSectionChange).toHaveBeenCalledWith("page");
	});

	it("switches between the editor and live preview on mobile", async () => {
		mobileState.value = true;
		renderWorkspace();

		expect(screen.getByTestId("design-section-typography")).toBeInTheDocument();
		expect(screen.queryByTestId("preview")).not.toBeInTheDocument();

		await userEvent.click(screen.getByRole("button", { name: "Preview" }));

		expect(screen.getByTestId("preview")).toBeInTheDocument();
		expect(screen.queryByTestId("design-section-typography")).not.toBeInTheDocument();

		await userEvent.click(screen.getByRole("button", { name: "Editor" }));
		expect(screen.getByTestId("design-section-typography")).toBeInTheDocument();
	});

	it("shows the AI Review section in the content navigator when there are reviewable changes", () => {
		aiAssistantMock.hasReviewableChanges = true;
		renderWorkspace({ tab: "content", section: "experience" });

		const navigation = screen.getByRole("navigation", { name: "Resume content" });
		expect(within(navigation).getByRole("button", { name: "AI Review" })).toBeInTheDocument();
	});
});
