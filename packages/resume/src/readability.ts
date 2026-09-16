import type { ResumeData, Typography } from "@headcv/schema/resume/data";

export const LEGACY_RESUME_TYPOGRAPHY: Typography = {
	body: { fontFamily: "IBM Plex Serif", fontWeights: ["400", "500"], fontSize: 10, lineHeight: 1.5 },
	heading: { fontFamily: "IBM Plex Serif", fontWeights: ["600"], fontSize: 14, lineHeight: 1.5 },
};

export const READABLE_RESUME_TYPOGRAPHY: Typography = {
	body: { fontFamily: "Inter", fontWeights: ["400", "600"], fontSize: 11, lineHeight: 1.4 },
	heading: { fontFamily: "Inter", fontWeights: ["600", "700"], fontSize: 14, lineHeight: 1.3 },
};

const hasSameWeights = (left: string[], right: string[]) =>
	left.length === right.length && left.every((weight, index) => weight === right[index]);

const isLegacyTypography = (typography: Typography) =>
	typography.body.fontFamily === LEGACY_RESUME_TYPOGRAPHY.body.fontFamily &&
	hasSameWeights(typography.body.fontWeights, LEGACY_RESUME_TYPOGRAPHY.body.fontWeights) &&
	typography.body.fontSize === LEGACY_RESUME_TYPOGRAPHY.body.fontSize &&
	typography.body.lineHeight === LEGACY_RESUME_TYPOGRAPHY.body.lineHeight &&
	typography.heading.fontFamily === LEGACY_RESUME_TYPOGRAPHY.heading.fontFamily &&
	hasSameWeights(typography.heading.fontWeights, LEGACY_RESUME_TYPOGRAPHY.heading.fontWeights) &&
	typography.heading.fontSize === LEGACY_RESUME_TYPOGRAPHY.heading.fontSize &&
	typography.heading.lineHeight === LEGACY_RESUME_TYPOGRAPHY.heading.lineHeight;

export function upgradeLegacyResumeTypography(data: ResumeData): ResumeData {
	if (!isLegacyTypography(data.metadata.typography)) return data;

	return {
		...data,
		metadata: {
			...data.metadata,
			typography: structuredClone(READABLE_RESUME_TYPOGRAPHY),
		},
	};
}
