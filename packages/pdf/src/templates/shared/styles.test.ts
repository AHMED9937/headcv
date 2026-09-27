import { describe, expect, it } from "vitest";
import { applyMonochromeStyle, getMonochromeInk, getReadableSmallTextSize, mergeStyles } from "./styles";

describe("getReadableSmallTextSize", () => {
	it("enforces a readable 10pt floor", () => {
		expect(getReadableSmallTextSize(8.75)).toBe(10);
	});

	it("preserves larger configured text", () => {
		expect(getReadableSmallTextSize(11)).toBe(11);
	});
});

describe("getMonochromeInk", () => {
	it("uses dark ink on white and light tinted surfaces", () => {
		expect(getMonochromeInk("#ffffff")).toBe("#000000");
		expect(getMonochromeInk("rgba(91, 33, 182, 0.2)")).toBe("#000000");
	});

	it("uses white ink on dark template panels", () => {
		expect(getMonochromeInk("#26405c")).toBe("#ffffff");
	});
});

describe("resume ink", () => {
	const colors = {
		foreground: "#000000",
		background: "#ffffff",
		primary: "#5b21b6",
		sidebarBackground: "#26405c",
	};

	it("makes section titles and list markers black while retaining accent rules", () => {
		const context = { placement: "main" as const, colors };
		expect(
			mergeStyles(
				applyMonochromeStyle("sectionHeading", { color: colors.primary, borderBottomColor: colors.primary }, context),
			),
		).toEqual({ color: "#000000", borderBottomColor: colors.primary });
		expect(mergeStyles(applyMonochromeStyle("richListItemMarker", { color: colors.primary }, context))).toEqual({
			color: "#000000",
		});
	});

	it("uses white ink for titles and skill indicators on a dark sidebar", () => {
		const context = { placement: "sidebar" as const, colors };
		expect(mergeStyles(applyMonochromeStyle("sectionHeading", { color: colors.primary }, context)).color).toBe(
			"#ffffff",
		);
		expect(mergeStyles(applyMonochromeStyle("levelItem", { borderColor: colors.primary }, context)).borderColor).toBe(
			"#ffffff",
		);
		expect(
			mergeStyles(applyMonochromeStyle("levelItemActive", { backgroundColor: colors.primary }, context))
				.backgroundColor,
		).toBe("#ffffff");
	});

	it("leaves ordinary body text in its configured color", () => {
		const style = { color: colors.primary };
		expect(applyMonochromeStyle("text", style, { placement: "main", colors })).toBe(style);
	});
});
