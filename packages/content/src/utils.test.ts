import { describe, expect, it } from "vitest";
import { listUnresolvedPlaceholders, normalizeSkillName, resolvePlaceholders } from "./utils";

describe("utils", () => {
	describe("listUnresolvedPlaceholders", () => {
		it("extracts named placeholders from a pattern", () => {
			const placeholders = listUnresolvedPlaceholders(
				"Built [Feature] used by [UserCount] users, improving [Metric] by [Percentage].",
			);
			expect(placeholders).toEqual(["Feature", "UserCount", "Metric", "Percentage"]);
		});

		it("deduplicates repeated placeholders", () => {
			const placeholders = listUnresolvedPlaceholders("[Role] with [Role] experience");
			expect(placeholders).toEqual(["Role"]);
		});

		it("returns an empty array when there are no placeholders", () => {
			const placeholders = listUnresolvedPlaceholders("No placeholders here.");
			expect(placeholders).toEqual([]);
		});
	});

	describe("resolvePlaceholders", () => {
		it("replaces placeholders with provided values", () => {
			const { text, unresolved } = resolvePlaceholders("[Role] with [Years] years of experience.", {
				Role: "Engineer",
				Years: "5",
			});
			expect(text).toBe("Engineer with 5 years of experience.");
			expect(unresolved).toEqual([]);
		});

		it("reports unresolved placeholders", () => {
			const { text, unresolved } = resolvePlaceholders("[Role] with [Years] years of experience.", {
				Role: "Engineer",
			});
			expect(text).toBe("Engineer with [Years] years of experience.");
			expect(unresolved).toEqual(["Years"]);
		});

		it("ignores empty values", () => {
			const { unresolved } = resolvePlaceholders("[Role] with [Years] years.", {
				Role: "Engineer",
				Years: "",
			});
			expect(unresolved).toEqual(["Years"]);
		});
	});

	describe("normalizeSkillName", () => {
		it("lowercases and trims skill names", () => {
			expect(normalizeSkillName("  JavaScript ")).toBe("javascript");
		});

		it("collapses internal whitespace", () => {
			expect(normalizeSkillName("Project   Management")).toBe("project management");
		});
	});
});
