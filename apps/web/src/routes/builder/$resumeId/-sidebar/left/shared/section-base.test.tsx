// @vitest-environment happy-dom

import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { createContext, useContext } from "react";
import { useResumePreviewNavigationStore } from "@/features/resume/preview/preview-navigation";
import { BuilderSectionNavigationProvider } from "../../../-components/section-navigation-context";

const setCollapsed = vi.fn();
const expandLeftSection = vi.fn();
const navigateToSection = vi.fn();
const onRenameSection = vi.fn();
const onToggleVisibility = vi.fn();
const onAddItem = vi.fn();
const sectionState = { collapsed: false };

vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => ({
		data: {
			basics: {
				name: "John Doe",
				headline: "Engineer",
				email: "",
				phone: "",
				location: "",
				website: { url: "", label: "" },
				customFields: [],
			},
			picture: { hidden: true, url: "" },
			summary: { title: "Summary", columns: 1, hidden: false, content: "" },
			sections: { experience: { title: "Experience", columns: 1, hidden: false, items: [] } },
			customSections: [],
			metadata: {},
		},
	}),
}));
vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
}));
vi.mock("@/features/resume/builder/ai-assistant", () => ({
	useAiAssistant: () => ({ changedSections: [], selectReviewSection: vi.fn() }),
}));
vi.mock("../../../-store/section", () => ({
	useSectionStore: (
		selector: (state: {
			sections: Record<string, { collapsed: boolean }>;
			setCollapsed: typeof setCollapsed;
			expandLeftSection: typeof expandLeftSection;
		}) => unknown,
	) => selector({ sections: { experience: { collapsed: sectionState.collapsed } }, setCollapsed, expandLeftSection }),
}));
vi.mock("./use-section-actions", () => ({
	useSectionActions: () => ({
		canAddItem: true,
		canRename: true,
		canHide: true,
		canSetColumns: false,
		canReset: false,
		isHidden: false,
		columns: 1,
		onRenameSection,
		onToggleVisibility,
		onAddItem,
		onSetColumns: vi.fn(),
		onReset: vi.fn(),
	}),
}));

const AccordionContext = createContext<{
	value: string[];
	onValueChange: (value: string[]) => void;
}>({ value: [], onValueChange: () => undefined });
const AccordionItemContext = createContext<string | null>(null);

vi.mock("@headcv/ui/components/accordion", () => ({
	Accordion: ({
		children,
		value,
		onValueChange,
	}: {
		children: ReactNode;
		value: string[];
		onValueChange: (value: string[]) => void;
	}) => (
		<AccordionContext.Provider value={{ value, onValueChange }}>
			<div data-testid="accordion" data-value={value.join(",")} data-onvaluechange={String(Boolean(onValueChange))}>
				{children}
			</div>
		</AccordionContext.Provider>
	),
	AccordionItem: ({ children, value }: { children: ReactNode; value: string }) => (
		<AccordionItemContext.Provider value={value}>
			<div data-testid="accordion-item" data-value={value}>
				{children}
			</div>
		</AccordionItemContext.Provider>
	),
	AccordionTrigger: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
		const { value, onValueChange } = useContext(AccordionContext);
		const itemValue = useContext(AccordionItemContext);
		return (
			<button
				type="button"
				{...props}
				onClick={(event) => {
					props.onClick?.(event);
					if (!itemValue) return;
					onValueChange(value.includes(itemValue) ? [] : [itemValue]);
				}}
				data-testid="accordion-trigger"
				data-value={itemValue}
			>
				{children}
				<span data-testid="accordion-chevron" aria-hidden="true" />
			</button>
		);
	},
	AccordionContent: ({ children }: { children: ReactNode }) => <div data-testid="accordion-content">{children}</div>,
}));
vi.mock("./section-menu", () => ({
	SectionDropdownMenu: () => null,
}));

const { SectionBase } = await import("./section-base");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

beforeEach(() => {
	sectionState.collapsed = false;
	setCollapsed.mockClear();
	navigateToSection.mockClear();
	onRenameSection.mockClear();
	useResumePreviewNavigationStore.setState({ request: null });
});

function renderSectionBase({ navigable = false }: { navigable?: boolean } = {}) {
	const wrapper = ({ children }: { children: ReactNode }) => (
		<I18nProvider i18n={i18n}>
			{navigable ? (
				<BuilderSectionNavigationProvider navigateToSection={navigateToSection}>
					{children}
				</BuilderSectionNavigationProvider>
			) : (
				children
			)}
		</I18nProvider>
	);

	return render(<SectionBase type="experience">Experience content</SectionBase>, { wrapper });
}

describe("SectionBase", () => {
	it("renders the CVFlow-style title, chevron, and edit action", () => {
		renderSectionBase();

		expect(screen.getByRole("button", { name: "Show Experience in preview" })).toHaveTextContent("Experience");
		expect(screen.getByTestId("accordion-chevron")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Edit Experience heading" })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Add a new item to Experience" })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Hide Experience" })).not.toBeInTheDocument();
		expect(screen.queryByText("Tip")).not.toBeInTheDocument();
	});

	it("navigates to the section in the preview when the title is clicked", async () => {
		sectionState.collapsed = false;
		const view = renderSectionBase({ navigable: true });

		await userEvent.click(screen.getByRole("button", { name: "Show Experience in preview" }));

		expect(setCollapsed).toHaveBeenCalledWith("experience", true);
		expect(navigateToSection).not.toHaveBeenCalled();

		view.unmount();
		sectionState.collapsed = true;
		renderSectionBase({ navigable: true });

		await userEvent.click(screen.getByRole("button", { name: "Show Experience in preview" }));

		expect(expandLeftSection).toHaveBeenCalledWith("experience");
		expect(navigateToSection).toHaveBeenCalledWith("experience");
		expect(useResumePreviewNavigationStore.getState().request?.sectionId).toBe("experience");
	});

	it("renames without toggling the section", async () => {
		renderSectionBase();

		await userEvent.click(screen.getByRole("button", { name: "Edit Experience heading" }));
		expect(onRenameSection).toHaveBeenCalled();
		expect(setCollapsed).not.toHaveBeenCalled();
	});
});
