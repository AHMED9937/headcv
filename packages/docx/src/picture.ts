import type { Picture } from "@headcv/schema/resume/data";

/** A profile photo fetched and decoded into bytes ready for a docx `ImageRun`. */
export interface LoadedPicture {
	data: ArrayBuffer;
	/** docx only embeds these raster formats; SVG is skipped (no reliable fallback). */
	type: "png" | "jpg" | "gif" | "bmp";
	widthPx: number;
	heightPx: number;
	rotation: number;
}

/** Mirrors the PDF/template rule: render only a visible photo with a real URL. */
const isVisible = (picture: Picture): boolean => !picture.hidden && picture.url.trim() !== "";

/** docx transformation units are pixels at 96dpi; resume sizes are stored in points. */
const ptToPx = (pt: number): number => Math.round((pt * 96) / 72);

/** Detects the raster format from the file's magic bytes; null for anything docx can't embed. */
function detectType(bytes: Uint8Array): LoadedPicture["type"] | null {
	if (bytes.length < 4) return null;
	if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
	if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
	if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "gif";
	if (bytes[0] === 0x42 && bytes[1] === 0x4d) return "bmp";
	return null;
}

/**
 * Fetches the resume photo and returns the bytes + print dimensions for a docx image.
 *
 * Runs client-side where `buildDocx` is called, so a same-origin `/uploads/...`
 * URL needs no CORS. Any failure (hidden photo, network error, unsupported
 * format, no `fetch`) resolves to `null` so the export proceeds without the photo
 * rather than failing the whole download.
 */
export async function loadPicture(picture: Picture): Promise<LoadedPicture | null> {
	if (!isVisible(picture) || typeof fetch !== "function") return null;

	try {
		const response = await fetch(picture.url);
		if (!response.ok) return null;

		const data = await response.arrayBuffer();
		const type = detectType(new Uint8Array(data.slice(0, 4)));
		if (!type) return null;

		// Stored photos are pre-cropped to `aspectRatio` (width / height), so deriving
		// height from the chosen width preserves that crop in Word.
		const widthPx = ptToPx(picture.size);
		const aspectRatio = picture.aspectRatio > 0 ? picture.aspectRatio : 1;
		const heightPx = Math.round(widthPx / aspectRatio);

		return { data, type, widthPx, heightPx, rotation: picture.rotation };
	} catch {
		return null;
	}
}
