import { create } from "zustand";

export type ResumePreviewNavigationRequest = {
	id: number;
	requestedAt: number;
	sectionId: string;
};

type ResumePreviewNavigationState = {
	request: ResumePreviewNavigationRequest | null;
	requestSection: (sectionId: string) => void;
};

let nextRequestId = 1;

export const useResumePreviewNavigationStore = create<ResumePreviewNavigationState>((set) => ({
	request: null,
	requestSection: (sectionId) => {
		if (!sectionId) return;
		set({ request: { id: nextRequestId++, requestedAt: Date.now(), sectionId } });
	},
}));

export function requestResumePreviewSection(sectionId: string) {
	useResumePreviewNavigationStore.getState().requestSection(sectionId);
}

export function getResumePreviewSectionId(sectionId: string) {
	return sectionId === "picture" || sectionId === "personal-details" ? "basics" : sectionId;
}
