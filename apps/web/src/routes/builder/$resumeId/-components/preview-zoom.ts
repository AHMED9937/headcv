export const MIN_PREVIEW_SCALE = 0.5;
export const MAX_PREVIEW_SCALE = 2;
export const PREVIEW_SCALE_STEP = 0.1;
export const PREVIEW_HORIZONTAL_PADDING = 48;

export const clampPreviewScale = (scale: number) => Math.min(MAX_PREVIEW_SCALE, Math.max(MIN_PREVIEW_SCALE, scale));

export const getFitWidthScale = (viewportWidth: number, pageWidth: number, horizontalPadding = 0) => {
	if (viewportWidth <= horizontalPadding || pageWidth <= 0) return MIN_PREVIEW_SCALE;
	return clampPreviewScale((viewportWidth - horizontalPadding) / pageWidth);
};

export const adjustPreviewScale = (scale: number, direction: "in" | "out") => {
	const delta = direction === "in" ? PREVIEW_SCALE_STEP : -PREVIEW_SCALE_STEP;
	return clampPreviewScale(Math.round((scale + delta) * 10) / 10);
};

export const formatPreviewScale = (scale: number) => `${Math.round(scale * 100)}%`;
