import { describe, expect, it } from "vitest";
import { getEducationSplitRowContent, hasSplitRowText, promoteSplitRowRight } from "./split-row";

describe("hasSplitRowText", () => {
	it("returns true only for non-empty text", () => {
		expect(hasSplitRowText("2019 - 2024")).toBe(true);
		expect(hasSplitRowText("   ")).toBe(false);
		expect(hasSplitRowText(undefined)).toBe(false);
	});
});

describe("promoteSplitRowRight", () => {
	it("keeps both right cells when the top-right cell has content", () => {
		expect(promoteSplitRowRight({ top: "Remote", bottom: "2019 - 2024" })).toEqual({
			top: "Remote",
			bottom: "2019 - 2024",
		});
	});

	it("moves bottom-right content to the top right when top-right content is missing", () => {
		expect(promoteSplitRowRight({ top: "", bottom: "2019 - 2024" })).toEqual({ top: "2019 - 2024", bottom: "" });
	});

	it("treats whitespace-only cells as missing", () => {
		expect(promoteSplitRowRight({ top: "   ", bottom: "\t" })).toEqual({ top: "", bottom: "" });
	});
});

describe("getEducationSplitRowContent", () => {
	it("keeps the period separate from the location in the end-aligned cell", () => {
		expect(
			getEducationSplitRowContent({
				degree: "Bachelor of Computers and Information",
				grade: "",
				area: "",
				location: "Ismailia, Egypt",
				period: "December 2021 - July 2025",
			}),
		).toEqual({
			topRight: "Bachelor of Computers and Information",
			bottomLeft: "Ismailia, Egypt",
			bottomRight: "December 2021 - July 2025",
		});
	});

	it("groups education metadata without merging it into the period", () => {
		expect(
			getEducationSplitRowContent({
				degree: "BSc",
				grade: "3.8 GPA",
				area: "Computer Science",
				location: "Cairo",
				period: "2020 - 2024",
			}),
		).toEqual({
			topRight: "BSc • 3.8 GPA",
			bottomLeft: "Computer Science • Cairo",
			bottomRight: "2020 - 2024",
		});
	});

	it("promotes the period when no degree or grade is available", () => {
		expect(
			getEducationSplitRowContent({
				degree: "",
				grade: "",
				area: "Computer Science",
				location: "Cairo",
				period: "2020 - 2024",
			}),
		).toEqual({
			topRight: "2020 - 2024",
			bottomLeft: "Computer Science • Cairo",
			bottomRight: "",
		});
	});
});
