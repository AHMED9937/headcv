import { describe, expect, it } from "vitest";
import { builderSearchSchema, DEFAULT_CONTENT_SECTION, DEFAULT_DESIGN_SECTION } from "./workspace-search";

describe("builderSearchSchema", () => {
	it("preserves valid content and design selections", () => {
		expect(
			builderSearchSchema.parse({
				tab: "design",
				section: "experience",
				designSection: "typography",
				reviewSection: "skills",
			}),
		).toMatchObject({
			tab: "design",
			section: "experience",
			designSection: "typography",
			reviewSection: "skills",
		});
	});

	it("falls back safely when a section in the URL is invalid", () => {
		expect(
			builderSearchSchema.parse({
				tab: "design",
				section: "not-a-content-section",
				designSection: "not-a-design-section",
			}),
		).toMatchObject({
			section: DEFAULT_CONTENT_SECTION,
			designSection: DEFAULT_DESIGN_SECTION,
		});
	});

	it("keeps optional section parameters absent", () => {
		const result = builderSearchSchema.parse({ tab: "content" });

		expect(result.section).toBeUndefined();
		expect(result.designSection).toBeUndefined();
	});
});
