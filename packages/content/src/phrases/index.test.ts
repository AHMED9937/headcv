import { describe, expect, it } from "vitest";
import { getPhrases } from "./index";

describe("phrases", () => {
	it("filters phrases by section type", () => {
		const phrases = getPhrases({ sectionType: "experience", locale: "en" });
		expect(phrases.length).toBeGreaterThan(0);
		expect(phrases.every((p) => p.sectionType === "experience")).toBe(true);
	});

	it("filters phrases by job title", () => {
		const phrases = getPhrases({
			sectionType: "experience",
			jobTitleId: "software-engineer",
			experienceLevel: "mid",
			locale: "en",
		});
		expect(phrases.length).toBeGreaterThan(0);
		expect(phrases.some((p) => p.jobTitleIds.includes("software-engineer"))).toBe(true);
	});

	it("falls back to general phrases when job title has no specific match", () => {
		const phrases = getPhrases({
			sectionType: "experience",
			jobTitleId: "ui-ux-designer",
			experienceLevel: "senior",
			locale: "en",
		});
		expect(phrases.some((p) => p.jobTitleIds.includes("general"))).toBe(true);
	});

	it("filters phrases by experience level", () => {
		const phrases = getPhrases({
			sectionType: "experience",
			jobTitleId: "general",
			experienceLevel: "entry",
			locale: "en",
		});
		expect(phrases.every((p) => p.experienceLevels.includes("entry"))).toBe(true);
	});

	it("returns arabic phrases when locale is ar", () => {
		const phrases = getPhrases({ sectionType: "summary", locale: "ar" });
		expect(phrases.length).toBeGreaterThan(0);
		expect(phrases[0]?.pattern).toContain("بخبرة");
	});
});
