import type { ExperienceLevel, Locale, Skill } from "../types";
import Fuse from "fuse.js";
import arRaw from "./ar.json";
import enRaw from "./en.json";

const catalogues: Record<Locale, Skill[]> = {
	en: enRaw as Skill[],
	ar: arRaw as Skill[],
};

export type SkillFilters = {
	jobTitleId?: string;
	experienceLevel?: ExperienceLevel;
	locale: Locale;
	query?: string;
};

export function getSkills(filters: SkillFilters): Skill[] {
	const list = catalogues[filters.locale];

	let result = list.filter((skill) => {
		if (filters.jobTitleId && !skill.jobTitleIds.includes(filters.jobTitleId) && !skill.jobTitleIds.includes("general"))
			return false;

		if (filters.experienceLevel && !skill.experienceLevels.includes(filters.experienceLevel)) return false;

		return true;
	});

	const trimmedQuery = filters.query?.trim();
	if (trimmedQuery) {
		const fuse = new Fuse(result, {
			keys: ["nameEn", "nameAr", "category"],
			threshold: 0.4,
		});
		result = fuse.search(trimmedQuery).map((item) => item.item);
	}

	return result;
}
