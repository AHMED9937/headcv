import type { JobTitle, Locale } from "../types";
import Fuse from "fuse.js";
import arRaw from "./ar.json";
import enRaw from "./en.json";

const catalogues: Record<Locale, JobTitle[]> = {
	en: enRaw as JobTitle[],
	ar: arRaw as JobTitle[],
};

export function getJobTitles(locale: Locale): JobTitle[] {
	return catalogues[locale];
}

export function searchJobTitles(query: string, locale: Locale, options?: { limit?: number }): JobTitle[] {
	const list = getJobTitles(locale);
	const trimmedQuery = query.trim();

	if (!trimmedQuery) return list.slice(0, options?.limit ?? 10);

	const fuse = new Fuse(list, {
		keys: ["title", "category"],
		threshold: 0.4,
	});

	return fuse
		.search(trimmedQuery)
		.map((result) => result.item)
		.slice(0, options?.limit ?? 10);
}

export function getJobTitleById(id: string, locale: Locale): JobTitle | undefined {
	return getJobTitles(locale).find((jobTitle) => jobTitle.id === id);
}
