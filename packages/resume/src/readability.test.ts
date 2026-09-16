import { describe, expect, it } from "vitest";
import { defaultResumeData } from "@headcv/schema/resume/default";
import { LEGACY_RESUME_TYPOGRAPHY, READABLE_RESUME_TYPOGRAPHY, upgradeLegacyResumeTypography } from "./readability";

describe("upgradeLegacyResumeTypography", () => {
	it("keeps the schema default aligned with the readable preset", () => {
		expect(defaultResumeData.metadata.typography).toEqual(READABLE_RESUME_TYPOGRAPHY);
	});

	it("upgrades the exact legacy typography preset", () => {
		const data = structuredClone(defaultResumeData);
		data.metadata.typography = structuredClone(LEGACY_RESUME_TYPOGRAPHY);

		expect(upgradeLegacyResumeTypography(data).metadata.typography).toEqual(READABLE_RESUME_TYPOGRAPHY);
	});

	it("preserves customized typography", () => {
		const data = structuredClone(defaultResumeData);
		data.metadata.typography.body.fontSize = 12;

		expect(upgradeLegacyResumeTypography(data)).toBe(data);
		expect(data.metadata.typography.body.fontSize).toBe(12);
	});

	it("does not mutate legacy resume data", () => {
		const data = structuredClone(defaultResumeData);
		data.metadata.typography = structuredClone(LEGACY_RESUME_TYPOGRAPHY);

		upgradeLegacyResumeTypography(data);

		expect(data.metadata.typography).toEqual(LEGACY_RESUME_TYPOGRAPHY);
	});
});
