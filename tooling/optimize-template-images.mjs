/**
 * Re-encodes template preview JPEGs to the size they are actually displayed at.
 * The gallery shipped 2110px originals (~1.1 MB each) into 342px cards, which made
 * /templates take >10 s to paint on mobile.
 *
 *   node tooling/optimize-template-images.mjs
 *
 * Paths and formats stay the same so no component changes are needed. Re-running is
 * safe: files already at or below the target width and byte budget are skipped, so
 * JPEGs are never re-compressed twice.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

// sharp is a dependency of apps/server; resolve it from there.
const sharp = createRequire(new URL("../apps/server/package.json", import.meta.url))("sharp");

const TARGETS = [
	// Gallery cards render at most 342 CSS px wide; 1000px covers 3x phones.
	{ directory: "../apps/web/public/templates/gallery/", maxWidth: 1000, quality: 82, maxBytes: 200 * 1024 },
	// Picker thumbnails and the landing showcase; keep 1055px for the template dialog.
	{ directory: "../apps/web/public/templates/jpg/", maxWidth: 1055, quality: 82, maxBytes: 200 * 1024 },
];

let savedBytes = 0;

for (const { directory, maxWidth, quality, maxBytes } of TARGETS) {
	const folder = new URL(directory, import.meta.url);

	for (const name of readdirSync(folder).filter((file) => file.endsWith(".jpg"))) {
		const file = new URL(name, folder);
		const input = readFileSync(file);
		const { width = 0 } = await sharp(input).metadata();

		if (width <= maxWidth && input.byteLength <= maxBytes) continue;

		const output = await sharp(input)
			.resize({ width: maxWidth, withoutEnlargement: true })
			.jpeg({ quality, mozjpeg: true, progressive: true })
			.toBuffer();

		if (output.byteLength >= input.byteLength) continue;

		writeFileSync(file, output);
		savedBytes += input.byteLength - output.byteLength;
		console.log(
			`${directory}${name}: ${Math.round(input.byteLength / 1024)} KiB -> ${Math.round(output.byteLength / 1024)} KiB`,
		);
	}
}

console.log(`Saved ${Math.round(savedBytes / 1024)} KiB`);
