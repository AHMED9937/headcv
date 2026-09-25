// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { useDialogStore } from "@/dialogs/store";
import { useResumePreviewNavigationStore } from "@/features/resume/preview/preview-navigation";

const updateResumeData = vi.fn();
const updateResumeDataLocal = vi.fn();
const confirm = vi.fn();

vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => ({
		data: {
			sections: {
				experience: { title: "Experience", columns: 1, hidden: false, items: [] },
				education: { title: "Education", columns: 1, hidden: false, items: [] },
			},
			customSections: [],
		},
	}),
	useUpdateResumeData: () => updateResumeData,
	useUpdateResumeDataLocal: () => updateResumeDataLocal,
}));

vi.mock("@/hooks/use-confirm", () => ({
	useConfirm: () => confirm,
}));

vi.mock("@tanstack/react-router", () => ({
	useBlocker: vi.fn(),
}));

vi.mock("@/dialogs/renderers", () => ({
	renderDialog: () => (
		<form data-testid="inline-form">
			<input type="text" name="company" />
		</form>
	),
}));

const { InlineSectionEditor } = await import("./inline-section-editor");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

beforeEach(() => {
	useDialogStore.setState({ open: false, activeDialog: null, onBeforeClose: null, presentation: "modal" });
	updateResumeData.mockClear();
	updateResumeDataLocal.mockClear();
	confirm.mockClear();
	useResumePreviewNavigationStore.setState({ request: null });
});

describe("InlineSectionEditor", () => {
	it("asks the unsaved-changes guard before Back leaves the entry", async () => {
		const guard = vi.fn().mockResolvedValue(false);
		useDialogStore.setState({
			open: false,
			presentation: "inline",
			activeDialog: { type: "resume.sections.experience.create", data: undefined },
			onBeforeClose: guard,
		});

		render(
			<I18nProvider i18n={i18n}>
				<InlineSectionEditor />
			</I18nProvider>,
		);

		await userEvent.setup().click(screen.getByRole("button", { name: /Back to entries/i }));

		expect(guard).toHaveBeenCalledOnce();
		expect(useDialogStore.getState().activeDialog?.type).toBe("resume.sections.experience.create");
	});

	it("renders the create form inline without hide/delete actions", () => {
		useDialogStore.setState({
			open: false,
			presentation: "inline",
			activeDialog: { type: "resume.sections.experience.create", data: undefined },
		});

		render(
			<I18nProvider i18n={i18n}>
				<InlineSectionEditor />
			</I18nProvider>,
		);

		expect(screen.getByTestId("inline-form")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Done/i })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /Delete/i })).not.toBeInTheDocument();
		expect(screen.queryByTitle(/Hide|Show/i)).not.toBeInTheDocument();
		expect(useResumePreviewNavigationStore.getState().request?.sectionId).toBe("experience");
	});

	it("targets the containing custom section when editing one of its entries", () => {
		useDialogStore.setState({
			open: false,
			presentation: "inline",
			activeDialog: {
				type: "resume.sections.experience.update",
				data: { item: { id: "item-1", hidden: false } as never, customSectionId: "custom-1" },
			},
		});

		render(
			<I18nProvider i18n={i18n}>
				<InlineSectionEditor />
			</I18nProvider>,
		);

		expect(useResumePreviewNavigationStore.getState().request?.sectionId).toBe("custom-1");
	});

	it("renders the update form inline with hide and delete actions", () => {
		useDialogStore.setState({
			open: false,
			presentation: "inline",
			activeDialog: {
				type: "resume.sections.experience.update",
				data: { item: { id: "item-1", hidden: false } as never, customSectionId: undefined },
			},
		});

		render(
			<I18nProvider i18n={i18n}>
				<InlineSectionEditor />
			</I18nProvider>,
		);

		expect(screen.getByTestId("inline-form")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Delete/i })).toBeInTheDocument();
		expect(screen.getByTitle(/Hide|Show/i)).toBeInTheDocument();
	});

	it("shows entry tips only after Get Tips is clicked", async () => {
		useDialogStore.setState({
			open: false,
			presentation: "inline",
			activeDialog: {
				type: "resume.sections.experience.update",
				data: { item: { id: "item-1", hidden: false } as never },
			},
		});

		render(
			<I18nProvider i18n={i18n}>
				<InlineSectionEditor />
			</I18nProvider>,
		);

		const getTips = screen.getByRole("button", { name: /Get Tips/i });
		expect(screen.queryByText(/Start with an action/)).not.toBeInTheDocument();
		await userEvent.click(getTips);
		expect(screen.getByText(/Start with an action/)).toBeInTheDocument();
		expect(getTips).toHaveAttribute("aria-expanded", "true");
		await userEvent.click(getTips);
		expect(screen.queryByText(/Start with an action/)).not.toBeInTheDocument();
	});

	it("renders custom-section creation inline without item-only actions or tips", () => {
		useDialogStore.setState({
			open: false,
			presentation: "inline",
			activeDialog: { type: "resume.sections.custom.create", data: undefined },
		});

		render(
			<I18nProvider i18n={i18n}>
				<InlineSectionEditor />
			</I18nProvider>,
		);

		expect(screen.getByTestId("inline-form")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Done/i })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /Delete/i })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /Get Tips/i })).not.toBeInTheDocument();
	});
});
