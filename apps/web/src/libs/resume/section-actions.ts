import type { CustomSection, ResumeData, SectionType } from "@headcv/schema/resume/data";
import type { WritableDraft } from "immer";

/**
 * Adds a newly created custom section after the final section in the CV layout.
 * Existing sections are intentionally ignored so editing never changes placement.
 */
export function appendCustomSectionToEnd(draft: WritableDraft<ResumeData>, section: CustomSection): boolean {
	if (draft.customSections.some((candidate) => candidate.id === section.id)) return false;

	draft.customSections.push(section as WritableDraft<CustomSection>);
	let lastPage = draft.metadata.layout.pages.at(-1);
	if (!lastPage) {
		draft.metadata.layout.pages.push({ fullWidth: false, main: [], sidebar: [] });
		lastPage = draft.metadata.layout.pages.at(-1);
	}
	lastPage?.main.push(section.id);
	return true;
}

const SIDEBAR_SECTIONS: ReadonlySet<SectionType> = new Set([
	"skills",
	"certifications",
	"awards",
	"languages",
	"interests",
	"publications",
]);

/**
 * Makes a built-in section visible and places it on the layout if no page lists it yet.
 * Templates and imports often omit optional sections, which would otherwise never render.
 */
export function ensureSectionInLayout(draft: WritableDraft<ResumeData>, sectionKey: SectionType) {
	draft.sections[sectionKey].hidden = false;

	const pages = draft.metadata.layout.pages;
	if (pages.some((page) => page.main.includes(sectionKey) || page.sidebar.includes(sectionKey))) return;

	let lastPage = pages.at(-1);
	if (!lastPage) {
		pages.push({ fullWidth: false, main: [], sidebar: [] });
		lastPage = pages.at(-1);
	}
	if (!lastPage) return;

	if (SIDEBAR_SECTIONS.has(sectionKey) && !lastPage.fullWidth) lastPage.sidebar.push(sectionKey);
	else lastPage.main.push(sectionKey);
}

/**
 * Pushes a new item into a section's items array.
 * Handles both built-in sections and custom sections.
 */
export function createSectionItem(
	draft: WritableDraft<ResumeData>,
	sectionKey: SectionType | "summary",
	formData: Record<string, unknown>,
	customSectionId?: string,
) {
	const id = formData.id as string | undefined;
	if (!customSectionId && sectionKey === "summary") {
		draft.summary.content = String(formData.content ?? "");
		draft.summary.hidden = Boolean(formData.hidden);
		return;
	}

	if (customSectionId) {
		const section = draft.customSections.find((s) => s.id === customSectionId);
		if (!section) return;
		const index = id ? section.items.findIndex((item) => item.id === id) : -1;
		if (index !== -1) section.items[index] = formData as never;
		else section.items.push(formData as never);
	} else {
		const items = draft.sections[sectionKey as SectionType].items as Array<{ id: string }>;
		const index = id ? items.findIndex((item) => item.id === id) : -1;
		if (index !== -1) (items[index] as unknown as Record<string, unknown>) = formData;
		else items.push(formData as { id: string });
		ensureSectionInLayout(draft, sectionKey as SectionType);
	}
}

/**
 * Finds and replaces an existing item in a section's items array by id.
 * Handles both built-in sections and custom sections.
 */
export function updateSectionItem(
	draft: WritableDraft<ResumeData>,
	sectionKey: SectionType | "summary",
	formData: { id: string } & Record<string, unknown>,
	customSectionId?: string,
) {
	if (!customSectionId && sectionKey === "summary") {
		draft.summary.content = String(formData.content ?? "");
		draft.summary.hidden = Boolean(formData.hidden);
		return;
	}
	if (customSectionId) {
		const section = draft.customSections.find((s) => s.id === customSectionId);
		if (!section) return;
		const index = section.items.findIndex((item) => item.id === formData.id);
		if (index !== -1) section.items[index] = formData as never;
	} else {
		const items = draft.sections[sectionKey as SectionType].items as Array<{ id: string }>;
		const index = items.findIndex((item) => item.id === formData.id);
		if (index !== -1) (items[index] as unknown as Record<string, unknown>) = formData;
	}
}

export function toggleSectionItemHidden(
	draft: WritableDraft<ResumeData>,
	sectionKey: SectionType | "summary",
	itemId: string,
	customSectionId?: string,
) {
	if (!customSectionId && sectionKey === "summary") {
		draft.summary.hidden = !draft.summary.hidden;
		return;
	}
	const section = customSectionId
		? draft.customSections.find((candidate) => candidate.id === customSectionId)
		: draft.sections[sectionKey as SectionType];
	if (!section || !("items" in section)) return;
	const item = section.items.find((candidate) => candidate.id === itemId);
	if (item) item.hidden = !item.hidden;
}

export function deleteSectionItem(
	draft: WritableDraft<ResumeData>,
	sectionKey: SectionType | "summary",
	itemId: string,
	customSectionId?: string,
) {
	if (!customSectionId && sectionKey === "summary") {
		draft.summary.content = "";
		return;
	}
	const section = customSectionId
		? draft.customSections.find((candidate) => candidate.id === customSectionId)
		: draft.sections[sectionKey as SectionType];
	if (!section || !("items" in section)) return;
	const index = section.items.findIndex((candidate) => candidate.id === itemId);
	if (index !== -1) section.items.splice(index, 1);
}

export function toggleCustomSectionHidden(draft: WritableDraft<ResumeData>, sectionId: string) {
	const section = draft.customSections.find((candidate) => candidate.id === sectionId);
	if (section) section.hidden = !section.hidden;
}

export function deleteCustomSection(draft: WritableDraft<ResumeData>, sectionId: string) {
	draft.customSections = draft.customSections.filter((section) => section.id !== sectionId);
	for (const page of draft.metadata.layout.pages) {
		page.main = page.main.filter((id) => id !== sectionId);
		page.sidebar = page.sidebar.filter((id) => id !== sectionId);
	}
}
