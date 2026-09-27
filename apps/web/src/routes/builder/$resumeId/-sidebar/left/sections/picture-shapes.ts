import type { Picture } from "@headcv/schema/resume/data";
import { t } from "@lingui/core/macro";

export type PictureShapeId = "circle" | "square" | "rounded-square" | "portrait" | "rounded-portrait";

type PictureShape = {
	id: PictureShapeId;
	aspectRatio: number;
	/** Resume picture border radius in pt; 100 renders as a full circle. */
	borderRadius: number;
	/** Matching Tailwind radius for in-app previews. */
	className: string;
};

// Shapes map onto the existing picture schema fields, so templates need no changes.
export const PICTURE_SHAPES: readonly PictureShape[] = [
	{ id: "circle", aspectRatio: 1, borderRadius: 100, className: "rounded-full" },
	{ id: "square", aspectRatio: 1, borderRadius: 0, className: "rounded-none" },
	{ id: "rounded-square", aspectRatio: 1, borderRadius: 10, className: "rounded-xl" },
	{ id: "portrait", aspectRatio: 0.75, borderRadius: 0, className: "rounded-none" },
	{ id: "rounded-portrait", aspectRatio: 0.75, borderRadius: 10, className: "rounded-xl" },
];

export function getPictureShapeLabel(id: PictureShapeId): string {
	switch (id) {
		case "circle":
			return t({ comment: "Profile photo shape option", message: "Circle" });
		case "square":
			return t({ comment: "Profile photo shape option", message: "Square" });
		case "rounded-square":
			return t({ comment: "Profile photo shape option", message: "Rounded square" });
		case "portrait":
			return t({ comment: "Profile photo shape option", message: "Portrait" });
		case "rounded-portrait":
			return t({ comment: "Profile photo shape option", message: "Rounded portrait" });
	}
}

/** Closest preset for pictures saved before shapes existed (free-form aspect ratio / radius). */
export function getPictureShape(picture: Pick<Picture, "aspectRatio" | "borderRadius">): PictureShape {
	const isPortrait = picture.aspectRatio < 0.9;
	const candidates = PICTURE_SHAPES.filter((shape) => shape.aspectRatio < 1 === isPortrait);
	return candidates.reduce((best, shape) =>
		Math.abs(shape.borderRadius - picture.borderRadius) < Math.abs(best.borderRadius - picture.borderRadius)
			? shape
			: best,
	);
}
