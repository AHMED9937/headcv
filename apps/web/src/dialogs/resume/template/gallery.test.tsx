// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { templatePrimaryColors } from "@headcv/schema/templates";
import { Dialog } from "@headcv/ui/components/dialog";
import { useDialogStore } from "@/dialogs/store";

const updateResumeData = vi.hoisted(() => vi.fn());

vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => ({
		data: { metadata: { template: "ditto" } },
	}),
	useUpdateResumeData: () => updateResumeData,
}));

const { TemplateGalleryDialog } = await import("./gallery");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

afterEach(() => {
	updateResumeData.mockReset();
	useDialogStore.setState({ open: false, activeDialog: null, onBeforeClose: null });
});

type Draft = { metadata: { template: string; design: { colors: { primary: string } } } };

// Runs the recipe passed to updateResumeData against a Ditto draft with the given accent.
const applyRecipe = (primary: string) => {
	const recipe = updateResumeData.mock.calls[0]?.[0] as (draft: Draft) => void;
	const draft: Draft = { metadata: { template: "ditto", design: { colors: { primary } } } };
	recipe(draft);
	return draft;
};

const renderGallery = () =>
	render(
		<I18nProvider i18n={i18n}>
			<Dialog open>
				<TemplateGalleryDialog />
			</Dialog>
		</I18nProvider>,
	);

describe("TemplateGalleryDialog", () => {
	it("renders the documented title and intro copy", () => {
		renderGallery();
		expect(screen.getByText("Template Gallery")).toBeInTheDocument();
		expect(screen.getByText(/range of resume templates/)).toBeInTheDocument();
	});

	it("renders one tile per template", () => {
		renderGallery();
		// Each tile renders an <img alt={metadata.name}>. The data module lists 14 templates.
		const images = screen.getAllByRole("img");
		expect(images.length).toBeGreaterThanOrEqual(14);
	});

	it("ring-highlights the currently-selected template tile (Ditto)", () => {
		renderGallery();
		const dittoImg = screen.getByAltText("Ditto");
		const button = dittoImg.closest("button") as HTMLButtonElement;
		expect(button.className).toContain("ring-ring");
	});

	it("selecting a different template calls updateResumeData with the new template id", () => {
		renderGallery();
		const onyxImg = screen.getByAltText("Onyx");
		const button = onyxImg.closest("button") as HTMLButtonElement;
		fireEvent.click(button);

		expect(updateResumeData).toHaveBeenCalledTimes(1);
		const draft = applyRecipe(templatePrimaryColors.ditto);
		expect(draft.metadata.template).toBe("onyx");
	});

	it("switches a default accent to the new template's accent", () => {
		renderGallery();
		fireEvent.click(screen.getByAltText("Gengar").closest("button") as HTMLButtonElement);

		const draft = applyRecipe(templatePrimaryColors.ditto);
		expect(draft.metadata.design.colors.primary).toBe(templatePrimaryColors.gengar);
	});

	it("keeps a color the user picked when switching templates", () => {
		renderGallery();
		fireEvent.click(screen.getByAltText("Gengar").closest("button") as HTMLButtonElement);

		const draft = applyRecipe(templatePrimaryColors.azurill);
		expect(draft.metadata.design.colors.primary).toBe(templatePrimaryColors.azurill);
	});
});
