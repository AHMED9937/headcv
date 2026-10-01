// @vitest-environment happy-dom

import type { ComponentProps, ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { useBuilderSectionNavigation } from "./section-navigation-context";

const aiAssistantMock = vi.hoisted(() => ({ hasReviewableChanges: false }));

const {
	expandLeftSection,
	getContentSectionComponent,
	getDesignSectionComponent,
	isVisibleEditorSection,
	mobileState,
	setCollapsed,
} = vi.hoisted(() => ({
	getContentSectionComponent: vi.fn((section: string) => (
		<div data-testid={`content-section-${section}`}>{section}</div>
	)),
	getDesignSectionComponent: vi.fn((section: string) => (
		<div id={`sidebar-${section}`} data-testid={`design-section-${section}`}>
			{section}
		</div>
	)),
	isVisibleEditorSection: vi.fn((sectionId: string) => sectionId !== "projects" && sectionId !== "interests"),
	mobileState: { value: false },
	setCollapsed: vi.fn(),
	expandLeftSection: vi.fn(),
}));

vi.mock("@headcv/ui/components/scroll-area", () => ({
	ScrollArea: ({ children, className }: { children: ReactNode; className?: string }) => (
		<div className={className}>{children}</div>
	),
}));
vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => ({
		data: {
			basics: {
				name: "John Doe",
				headline: "Engineer",
				email: "john@example.com",
				phone: "+123",
				location: "Remote",
				website: { url: "https://example.com", label: "Portfolio" },
				customFields: [],
			},
			picture: {
				hidden: false,
				url: "",
				size: 64,
				rotation: 0,
				aspectRatio: 1,
				borderRadius: 0,
				borderColor: "",
				borderWidth: 0,
				shadowColor: "",
				shadowWidth: 0,
			},
			summary: { title: "Summary", columns: 1, hidden: false, content: "" },
			sections: { experience: { items: [] }, education: { items: [] } },
			customSections: [],
			metadata: {},
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
vi.mock("../-sidebar/left/sections/custom", () => ({
	CustomSectionBuilder: ({ showAdditionalSections }: { showAdditionalSections?: boolean }) => (
		<div data-testid="custom-section-builder" data-show-additional={String(showAdditionalSections)}>
			Custom Sections
		</div>
	),
}));
vi.mock("../-sidebar/left/sections/personal-details", () => ({
	PersonalDetailsSectionBuilder: () => {
		const { navigateToSection } = useBuilderSectionNavigation();
		return (
			<button type="button" data-testid="personal-details-section" onClick={() => navigateToSection?.("basics")}>
				Personal Details
			</button>
		);
	},
}));
vi.mock("../-sidebar/right/section-components", () => ({
	getSectionComponent: getDesignSectionComponent,
}));
vi.mock("../-sidebar/right/sections/export", () => ({
	ExportSectionBuilder: () => <div data-testid="export-section" />,
}));
vi.mock("../-sidebar/right/sections/layout/visibility", () => ({
	isVisibleEditorSection,
}));
vi.mock("../-store/section", () => ({
	useSectionStore: (
		selector: (state: { setCollapsed: typeof setCollapsed; expandLeftSection: typeof expandLeftSection }) => unknown,
	) => selector({ setCollapsed, expandLeftSection }),
}));

const { ImportedWorkspace } = await import("./imported-workspace");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

beforeEach(() => {
	mobileState.value = false;
	aiAssistantMock.hasReviewableChanges = false;
	setCollapsed.mockClear();
	expandLeftSection.mockClear();
	getContentSectionComponent.mockClear();
	getDesignSectionComponent.mockClear();
	isVisibleEditorSection.mockClear();
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
	it("renders every Design section stacked, with a rail highlighting the current one", async () => {
		const { props } = renderWorkspace({ isImported: true });
		const navigation = screen.getByRole("navigation", { name: "Design your resume" });
		const sectionButtons = within(navigation).getAllByRole("button");
		const designSections = ["template", "design", "typography", "layout", "page", "notes"];

		expect(sectionButtons.map((button) => button.textContent)).toEqual([
			"Template",
			"Design",
			"Typography",
			"Layout",
			"Page",
			"Notes",
		]);
		expect(within(navigation).getByRole("button", { name: "Typography" })).toHaveAttribute("aria-current", "location");
		expect(screen.getByText("Imported")).toBeInTheDocument();
		expect(screen.getAllByTestId(/^design-section-/).map((element) => element.dataset.testid)).toEqual(
			designSections.map((section) => `design-section-${section}`),
		);
		for (const section of designSections) expect(getDesignSectionComponent).toHaveBeenCalledWith(section);

		await userEvent.click(within(navigation).getByRole("button", { name: "Layout" }));
		expect(props.onDesignSectionChange).toHaveBeenCalledWith("layout");
	});

	it("scrolls to the current Design section when it is re-selected", async () => {
		const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView").mockImplementation(() => {});
		const { props } = renderWorkspace({ designSection: "page" });
		await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
		scrollIntoView.mockClear();

		const navigation = screen.getByRole("navigation", { name: "Design your resume" });
		await userEvent.click(within(navigation).getByRole("button", { name: "Page" }));

		expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
		expect(props.onDesignSectionChange).not.toHaveBeenCalled();
		scrollIntoView.mockRestore();
	});

	it("renders Content as stacked sections in CV order with a Personal Details card", () => {
		renderWorkspace({ tab: "content", section: "experience" });

		expect(screen.getByTestId("personal-details-section")).toBeInTheDocument();

		const visibleSections = [
			"summary",
			"experience",
			"education",
			"skills",
			"languages",
			"awards",
			"certifications",
			"publications",
			"volunteer",
			"references",
		];
		for (const sectionId of visibleSections) {
			expect(screen.getByTestId(`content-section-${sectionId}`)).toBeInTheDocument();
		}

		expect(screen.queryByTestId("content-section-picture")).not.toBeInTheDocument();
		expect(screen.queryByTestId("content-section-basics")).not.toBeInTheDocument();
		expect(screen.queryByTestId("content-section-projects")).not.toBeInTheDocument();
		expect(screen.queryByTestId("content-section-interests")).not.toBeInTheDocument();
		expect(screen.getByTestId("custom-section-builder")).toBeInTheDocument();
		expect(screen.getByTestId("custom-section-builder")).toHaveAttribute("data-show-additional", "true");
		expect(screen.queryByTestId("content-section-ai-review")).not.toBeInTheDocument();
	});

	it("navigates to basics from the Personal Details header", async () => {
		const { props } = renderWorkspace({ tab: "content", section: "summary" });

		await userEvent.click(screen.getByTestId("personal-details-section"));

		expect(props.onSectionChange).toHaveBeenCalledWith("basics");
	});

	it("expands the active Content section and scrolls to it", async () => {
		renderWorkspace({ tab: "content", section: "summary" });

		await waitFor(() => expect(expandLeftSection).toHaveBeenCalledWith("summary"));
	});

	it("shows the AI Review section when there are reviewable changes", () => {
		aiAssistantMock.hasReviewableChanges = true;
		renderWorkspace({ tab: "content", section: "experience" });

		expect(screen.getByTestId("content-section-ai-review")).toBeInTheDocument();
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
});
