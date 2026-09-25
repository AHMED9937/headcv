// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import {
	DEFAULT_PDF_PAGE_SIZE,
	getResumePreviewGapValue,
	getScaledPreviewPageSize,
	normalizeResumePreviewProps,
} from "./preview.shared";

describe("normalizeResumePreviewProps", () => {
	it("applies the documented defaults when fields are omitted", () => {
		const result = normalizeResumePreviewProps({});
		expect(result).toMatchObject({
			pageGap: 16,
			pageLayout: "horizontal",
			pageScale: 1,
			showPageNumbers: false,
		});
	});

	it("preserves supplied values and forwards extra props (className, data)", () => {
		const result = normalizeResumePreviewProps({
			className: "preview-class",
			pageGap: 16,
			pageLayout: "vertical",
			pageScale: 1.5,
			showPageNumbers: true,
		});

		expect(result.className).toBe("preview-class");
		expect(result.pageGap).toBe(16);
		expect(result.pageLayout).toBe("vertical");
		expect(result.pageScale).toBe(1.5);
		expect(result.showPageNumbers).toBe(true);
	});
});

describe("getScaledPreviewPageSize", () => {
	it("multiplies both dimensions by the scale", () => {
		const result = getScaledPreviewPageSize({ width: 100, height: 200 }, 2);
		expect(result).toEqual({ width: 200, height: 400 });
	});

	it("returns the default A4 page size unchanged when scaled by 1", () => {
		expect(getScaledPreviewPageSize(DEFAULT_PDF_PAGE_SIZE, 1)).toEqual(DEFAULT_PDF_PAGE_SIZE);
	});

	it("supports fractional scaling", () => {
		const result = getScaledPreviewPageSize({ width: 100, height: 200 }, 0.5);
		expect(result).toEqual({ width: 50, height: 100 });
	});
});

describe("getResumePreviewGapValue", () => {
	it("adds px units for numeric custom-property gap values", () => {
		expect(getResumePreviewGapValue(96)).toBe("96px");
	});

	it("preserves explicit zero gap", () => {
		expect(getResumePreviewGapValue(0)).toBe(0);
	});

	it("preserves string gap values", () => {
		expect(getResumePreviewGapValue("1rem")).toBe("1rem");
	});
});
