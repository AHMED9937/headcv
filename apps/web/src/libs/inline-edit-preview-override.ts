import type { Basics, CustomSection, Picture, ResumeData, SectionType } from "@headcv/schema/resume/data";
import { produce } from "immer";
import { useMemo } from "react";
import { create } from "zustand";
import { useResumeData } from "@/features/resume/builder/draft";
import { appendCustomSectionToEnd, createSectionItem } from "@/libs/resume/section-actions";

type InlineItemPreviewOverride = {
	kind?: "item";
	sectionType: SectionType;
	customSectionId?: string;
	itemId: string;
	values: Record<string, unknown>;
};

type InlineCustomSectionPreviewOverride = {
	kind: "custom-section";
	sectionId: string;
	values: CustomSection;
};

type InlinePersonalDetailsPreviewOverride = {
	kind: "personal-details";
	basics: Basics;
	picture: Picture;
};

export type InlineEditPreviewOverride =
	| InlineItemPreviewOverride
	| InlineCustomSectionPreviewOverride
	| InlinePersonalDetailsPreviewOverride;

type InlineEditPreviewOverrideState = {
	override: InlineEditPreviewOverride | null;
	setOverride: (override: InlineEditPreviewOverride | null) => void;
	clearOverride: () => void;
};

export const useInlineEditPreviewOverrideStore = create<InlineEditPreviewOverrideState>((set) => ({
	override: null,
	setOverride: (override) => set({ override }),
	clearOverride: () => set({ override: null }),
}));

function useInlineEditPreviewOverride() {
	return useInlineEditPreviewOverrideStore((state) => state.override);
}

export function useSetInlineEditPreviewOverride() {
	return useInlineEditPreviewOverrideStore((state) => state.setOverride);
}

export function useClearInlineEditPreviewOverride() {
	return useInlineEditPreviewOverrideStore((state) => state.clearOverride);
}

/**
 * Returns a copy of `base` where the inline-edit override item has been replaced
 * with its live form values. This is a pure function so it can be unit-tested
 * independently of React and the router.
 */
export function applyInlineEditOverride(base: ResumeData, override: InlineEditPreviewOverride): ResumeData {
	if (override.kind === "personal-details") {
		return produce(base, (draft) => {
			draft.basics = override.basics;
			draft.picture = override.picture;
		});
	}

	if (override.kind === "custom-section") {
		return produce(base, (draft) => {
			const index = draft.customSections.findIndex((section) => section.id === override.sectionId);
			if (index !== -1) {
				draft.customSections[index] = override.values;
				return;
			}

			appendCustomSectionToEnd(draft, override.values);
		});
	}

	const { sectionType, customSectionId, itemId, values } = override;

	return produce(base, (draft) => {
		if (!customSectionId && sectionType === ("summary" as SectionType)) {
			draft.summary.content = String(values.content ?? "");
			draft.summary.hidden = Boolean(values.hidden);
			return;
		}
		createSectionItem(draft, sectionType, { ...values, id: itemId }, customSectionId);
	});
}

/**
 * Returns the persisted resume data merged with any live inline-edit values that
 * have not been committed yet. This keeps keystrokes out of the global resume
 * store so the rest of the builder UI does not re-render on every keystroke.
 */
export function useResumeDataForPreview(): ResumeData | undefined {
	const base = useResumeData();
	const override = useInlineEditPreviewOverride();

	return useMemo(() => {
		if (!base || !override) return base;
		return applyInlineEditOverride(base, override);
	}, [base, override]);
}
