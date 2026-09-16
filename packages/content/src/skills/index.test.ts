import { describe, expect, it } from "vitest";
import { getSkills } from "./index";

describe("skills", () => {
	it("returns skills for a job title", () => {
		const skills = getSkills({ jobTitleId: "software-engineer", locale: "en" });
		expect(skills.length).toBeGreaterThan(0);
		expect(skills.some((s) => s.id === "javascript")).toBe(true);
	});

	it("includes general skills for any job title", () => {
		const skills = getSkills({ jobTitleId: "sales-representative", locale: "en" });
		expect(skills.some((s) => s.id === "communication")).toBe(true);
	});

	it("filters skills by experience level", () => {
		const skills = getSkills({
			jobTitleId: "devops-engineer",
			experienceLevel: "senior",
			locale: "en",
		});
		expect(skills.some((s) => s.id === "kubernetes")).toBe(true);
	});

	it("returns localized skill names", () => {
		const skills = getSkills({ jobTitleId: "software-engineer", locale: "ar" });
		const skill = skills.find((s) => s.id === "javascript");
		expect(skill?.nameAr).toBe("جافا سكريبت");
	});

	it("searches skills by query", () => {
		const skills = getSkills({ locale: "en", query: "java" });
		expect(skills.length).toBeGreaterThan(0);
		expect(skills.some((s) => s.id === "javascript")).toBe(true);
	});
});
