import type { Locale, SummaryFormula } from "../types";
import arRaw from "./ar.json";
import enRaw from "./en.json";

const catalogues: Record<Locale, SummaryFormula[]> = {
	en: enRaw as SummaryFormula[],
	ar: arRaw as SummaryFormula[],
};

export function getSummaryFormulas(locale: Locale): SummaryFormula[] {
	return catalogues[locale];
}
