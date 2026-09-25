import type { ResumeData, SectionType } from "@headcv/schema/resume/data";
import type { WritableDraft } from "immer";
import { createContext, useContext } from "react";

export type InlineResumeFormContextValue = {
	sectionType: SectionType | "custom";
	isCreate: boolean;
	customSectionId?: string;
	updateResumeDataLocal: (fn: (draft: WritableDraft<ResumeData>) => void) => void;
};

export const InlineResumeFormContext = createContext<InlineResumeFormContextValue | null>(null);

export function useInlineResumeFormContext() {
	return useContext(InlineResumeFormContext);
}
