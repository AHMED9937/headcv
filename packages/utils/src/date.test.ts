import { describe, expect, it } from "vitest";
import {
	formatDate,
	formatDateRange,
	formatPeriod,
	formatSingleDate,
	hydrateDateRange,
	normalizeMonthDate,
	parsePeriod,
	prepareDateRangeForSave,
} from "./date";

describe("formatDate", () => {
	it("formats YYYY-MM as 'Month Year'", () => {
		expect(formatDate("2024-03")).toBe("March 2024");
	});

	it("formats YYYY-MM-DD as 'Month Year' by default (day excluded)", () => {
		expect(formatDate("2024-03-15")).toBe("March 2024");
	});

	it("formats YYYY-MM-DD with includeDay=true as 'Month DD, Year'", () => {
		expect(formatDate("2024-03-15", true)).toBe("March 15, 2024");
	});

	it("returns YYYY unchanged when only year provided", () => {
		expect(formatDate("2024")).toBe("2024");
	});

	it("handles January (month 1)", () => {
		expect(formatDate("2024-01")).toBe("January 2024");
	});

	it("handles December (month 12)", () => {
		expect(formatDate("2024-12")).toBe("December 2024");
	});

	it("includes day even with single-digit days", () => {
		expect(formatDate("2024-03-05", true)).toBe("March 05, 2024");
	});

	it("returns 'undefined' month name when out-of-range month is supplied", () => {
		// Defensive: behavior documents what happens with bad input
		expect(formatDate("2024-13")).toBe("undefined 2024");
	});
});

describe("formatPeriod", () => {
	it("returns empty string when both dates missing", () => {
		expect(formatPeriod()).toBe("");
	});

	it("returns end date alone when start is missing", () => {
		expect(formatPeriod(undefined, "2024-05")).toBe("2024-05");
	});

	it("returns start - Present when end is missing", () => {
		expect(formatPeriod("2024-01")).toBe("January 2024 - Present");
	});

	it("formats both ends when both provided", () => {
		expect(formatPeriod("2020-06", "2024-03")).toBe("June 2020 - March 2024");
	});

	it("treats empty string start same as undefined", () => {
		expect(formatPeriod("", "2024-05")).toBe("2024-05");
	});

	it("treats empty string end same as undefined", () => {
		expect(formatPeriod("2024-01", "")).toBe("January 2024 - Present");
	});

	it("returns empty when start empty and end empty", () => {
		expect(formatPeriod("", "")).toBe("");
	});
});

describe("formatSingleDate", () => {
	it("returns empty string when date is undefined", () => {
		expect(formatSingleDate()).toBe("");
	});

	it("returns empty string when date is empty string", () => {
		expect(formatSingleDate("")).toBe("");
	});

	it("formats full date with day included", () => {
		expect(formatSingleDate("2024-03-15")).toBe("March 15, 2024");
	});

	it("formats year-month even with includeDay flag implied", () => {
		expect(formatSingleDate("2024-03")).toBe("March 2024");
	});

	it("returns plain year when only year present", () => {
		expect(formatSingleDate("2024")).toBe("2024");
	});
});

describe("parsePeriod", () => {
	it("migrates named-month periods", () => {
		expect(parsePeriod("March 2022 - Present")).toEqual({ startDate: "2022-03", endDate: "" });
	});

	it("migrates numeric month/year periods", () => {
		expect(parsePeriod("05/2026 \u2013 06/2026")).toEqual({ startDate: "2026-05", endDate: "2026-06" });
	});

	it("leaves unrecognized legacy values intact at the caller", () => {
		expect(parsePeriod("2020 - 2024")).toEqual({ startDate: "", endDate: "" });
	});
});

describe("normalizeMonthDate", () => {
	it("normalizes complete ISO dates for month inputs", () => {
		expect(normalizeMonthDate("2020-01-15")).toBe("2020-01");
	});
});

describe("date-range migration", () => {
	it("hydrates structured dates from a legacy period", () => {
		expect(hydrateDateRange({ period: "March 2022 - Present" })).toEqual({
			period: "March 2022 - Present",
			startDate: "2022-03",
			endDate: "",
		});
	});

	it("drops the legacy period when structured dates are available", () => {
		expect(
			prepareDateRangeForSave(
				{ startDate: "2022-03", endDate: "", period: "March 2022 - Present" },
				{ startDate: "2022-03", endDate: "", period: "March 2022 - Present" },
			),
		).toEqual({ startDate: "2022-03", endDate: "", period: undefined });
	});

	it("preserves untouched legacy text that cannot be migrated", () => {
		const initial = { startDate: "", endDate: "", period: "Spring 2022" };
		expect(prepareDateRangeForSave(initial, initial).period).toBe("Spring 2022");
	});

	it("formats structured dates with a legacy fallback", () => {
		expect(formatDateRange({ startDate: "2022-03", endDate: "2024-04" })).toBe("March 2022 - April 2024");
		expect(formatDateRange({ period: "Spring 2022" })).toBe("Spring 2022");
	});
});
