import type { ResumeData } from "@headcv/schema/resume/data";
import { enforceResumeLocale } from "./locale";
import { upgradeLegacyResumeTypography } from "./readability";

/**
 * Normalizes a resume data object before applying patches or rendering.
 *
 * This enforces the default resume locale and upgrades any legacy typography
 * values, keeping snapshots and current state on the same schema baseline.
 */
export function normalizeResumeData(data: ResumeData): ResumeData {
	return upgradeLegacyResumeTypography(enforceResumeLocale(data));
}
