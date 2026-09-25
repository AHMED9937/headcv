import { describe, expect, it } from "vitest";
import {
	adjustPreviewScale,
	clampPreviewScale,
	formatPreviewScale,
	getFitWidthScale,
	MAX_PREVIEW_SCALE,
	MIN_PREVIEW_SCALE,
} from "./preview-zoom";

describe("preview zoom", () => {
	it("fits the page to the usable viewport width", () => {
		expect(getFitWidthScale(648, 600, 48)).toBe(1);
	});

	it("does not enlarge the page above its natural size in fit-width mode", () => {
		expect(getFitWidthScale(1248, 600, 48)).toBe(1);
	});

	it("supports an explicit larger cap for full-size previews", () => {
		expect(getFitWidthScale(768, 600, 48, 1.5)).toBe(1.2);
	});

	it("clamps invalid fit widths and custom scales", () => {
		expect(getFitWidthScale(40, 600, 48)).toBe(MIN_PREVIEW_SCALE);
		expect(clampPreviewScale(0.1)).toBe(MIN_PREVIEW_SCALE);
		expect(clampPreviewScale(3)).toBe(MAX_PREVIEW_SCALE);
	});

	it("zooms in and out using stable decimal steps", () => {
		expect(adjustPreviewScale(0.7, "in")).toBe(0.8);
		expect(adjustPreviewScale(0.8, "out")).toBe(0.7);
	});

	it("formats the effective scale as a percentage", () => {
		expect(formatPreviewScale(0.875)).toBe("88%");
	});
});
