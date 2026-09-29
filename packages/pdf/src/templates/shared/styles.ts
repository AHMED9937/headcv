import type { Style } from "@react-pdf/types";
import { parseColorString } from "@headcv/utils/color";

export type TemplatePlacement = "main" | "sidebar";

export type StyleInput = Style | Style[] | null | undefined;

export const composeStyles = (...styles: StyleInput[]): Style[] => {
	return styles.flatMap((style) => {
		if (!style) return [];
		if (Array.isArray(style)) return style.filter(Boolean);

		return [style];
	});
};

const linkUnderlineStyle = { textDecoration: "underline" } satisfies Style;

export const composeLinkStyles = (...styles: StyleInput[]): Style[] => composeStyles(...styles, linkUnderlineStyle);

export const mergeStyles = (...styles: StyleInput[]): Style => Object.assign({}, ...composeStyles(...styles));

export const mergeLinkStyles = (...styles: StyleInput[]): Style => mergeStyles(...styles, linkUnderlineStyle);

// Increased from 1.2 to 1.3 to prevent descenders (g, p, y, etc.) from being
// clipped by the overflow:hidden applied in safeTextStyle on all Heading elements.
// At 1.5× heading font size, a lineHeight of 1.2 leaves insufficient room for
// the descender depth of many fonts, causing letters to appear visually cut off.
export const headerNameLineHeight = 1.3;
export const getReadableSmallTextSize = (fontSize: number) => Math.max(10, fontSize);

/** Pick black or white ink with the higher contrast against a page surface. */
export const getMonochromeInk = (surface: string, pageBackground = "#ffffff"): "#000000" | "#ffffff" => {
	const color = parseColorString(surface);
	const page = parseColorString(pageBackground);
	if (!color) return "#000000";

	const alpha = Math.max(0, Math.min(1, color.a));
	const channels = [color.r, color.g, color.b].map((channel, index) => {
		const backdrop = page ? ([page.r, page.g, page.b][index] ?? 255) : 255;
		const value = (channel * alpha + backdrop * (1 - alpha)) / 255;
		return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
	});
	const luminance = (channels[0] ?? 0) * 0.2126 + (channels[1] ?? 0) * 0.7152 + (channels[2] ?? 0) * 0.0722;
	return luminance > 0.179 ? "#000000" : "#ffffff";
};

type InkContext = {
	placement: TemplatePlacement;
	colors: { background: string; sidebarBackground?: string | undefined };
};

export const getPlacementInk = ({ placement, colors }: InkContext) =>
	getMonochromeInk(
		placement === "sidebar" ? (colors.sidebarBackground ?? colors.background) : colors.background,
		colors.background,
	);

export const applyMonochromeStyle = (slot: string, style: StyleInput, context: InkContext): StyleInput => {
	if (slot === "sectionHeading" || slot === "richListItemMarker")
		return composeStyles(style, { color: getPlacementInk(context) });
	if (slot === "levelItem") return composeStyles(style, { borderColor: getPlacementInk(context) });
	if (slot === "levelItemActive") return composeStyles(style, { backgroundColor: getPlacementInk(context) });
	return style;
};

export type ResolvePlacementColorOptions = {
	placement: TemplatePlacement;
	defaultForeground: string;
	sidebarForeground?: string | undefined;
};

export const resolvePlacementColor = ({
	placement,
	defaultForeground,
	sidebarForeground,
}: ResolvePlacementColorOptions) => {
	if (placement === "sidebar" && sidebarForeground) return sidebarForeground;

	return defaultForeground;
};
