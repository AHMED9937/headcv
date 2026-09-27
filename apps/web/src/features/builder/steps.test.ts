import { describe, expect, it } from "vitest";
import { getStepForSection, getStepSectionId } from "./steps";

describe("getStepForSection", () => {
	it.each([
		["basics", "personal-details"],
		["picture", "personal-details"],
		["experience", "work-experience"],
		["summary", "summary"],
		["custom", "additional-sections"],
		["projects", "additional-sections"],
	] as const)("maps %s to the %s step", (section, step) => {
		expect(getStepForSection(section)).toBe(step);
	});

	it("round-trips every step that edits a section", () => {
		for (const step of ["personal-details", "profiles", "work-experience", "education", "skills", "summary"] as const) {
			const section = getStepSectionId(step);
			expect(section && getStepForSection(section)).toBe(step);
		}
	});
});
