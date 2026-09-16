import type { ContentSectionType, ExperienceLevel, Locale, Phrase } from "../types";
import arRaw from "./ar.json";
import enRaw from "./en.json";

const catalogues: Record<Locale, Phrase[]> = {
	en: enRaw as Phrase[],
	ar: arRaw as Phrase[],
};

export type PhraseFilters = {
	sectionType?: ContentSectionType;
	jobTitleId?: string;
	experienceLevel?: ExperienceLevel;
	locale: Locale;
};

export function getPhrases(filters: PhraseFilters): Phrase[] {
	const list = catalogues[filters.locale];

	return list.filter((phrase) => {
		if (filters.sectionType && phrase.sectionType !== filters.sectionType) return false;

		if (
			filters.jobTitleId &&
			!phrase.jobTitleIds.includes(filters.jobTitleId) &&
			!phrase.jobTitleIds.includes("general")
		)
			return false;

		if (filters.experienceLevel && !phrase.experienceLevels.includes(filters.experienceLevel)) return false;

		return true;
	});
}
