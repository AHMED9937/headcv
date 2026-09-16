import { describe, expect, it } from "vitest";
import { getJobTitleById, getJobTitles, searchJobTitles } from "./index";

describe("job-titles", () => {
	describe("getJobTitles", () => {
		it("returns the english catalogue by default", () => {
			const titles = getJobTitles("en");
			expect(titles.length).toBeGreaterThan(0);
			expect(titles[0]?.title).toBeDefined();
		});

		it("returns the arabic catalogue when requested", () => {
			const titles = getJobTitles("ar");
			expect(titles.length).toBeGreaterThan(0);
			expect(titles.find((t) => t.id === "software-engineer")?.title).toBe("مهندس برمجيات");
		});
	});

	describe("searchJobTitles", () => {
		it("returns all titles when query is empty", () => {
			const titles = searchJobTitles("", "en", { limit: 5 });
			expect(titles.length).toBe(5);
		});

		it("returns relevant matches for a partial query", () => {
			const titles = searchJobTitles("soft", "en");
			expect(titles.some((t) => t.id === "software-engineer")).toBe(true);
		});

		it("returns no matches for a nonsense query", () => {
			const titles = searchJobTitles("xyz-nonsense", "en");
			expect(titles.length).toBe(0);
		});

		it("respects the limit option", () => {
			const titles = searchJobTitles("manager", "en", { limit: 2 });
			expect(titles.length).toBeLessThanOrEqual(2);
		});
	});

	describe("getJobTitleById", () => {
		it("returns a job title by id", () => {
			const title = getJobTitleById("software-engineer", "en");
			expect(title?.title).toBe("Software Engineer");
		});

		it("returns undefined for an unknown id", () => {
			const title = getJobTitleById("unknown-id", "en");
			expect(title).toBeUndefined();
		});
	});
});
