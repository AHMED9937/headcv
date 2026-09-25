/**
 * Shrinks raster photos embedded in SVGs (data URIs) to 3x their drawn size as high-quality JPEG,
 * leaving vector text and shapes untouched. Embedded PNG photos don't compress over the
 * network and made the landing hero ~2 MB.
 *
 *   node tooling/optimize-svg-images.mjs apps/web/public/templates/svg/*.svg
 *
 * JPEG (not WebP) because every SVG renderer supports it inside <image>.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

// sharp is a dependency of apps/server; resolve it from there.
const sharp = createRequire(new URL("../apps/server/package.json", import.meta.url))("sharp");

// 3x covers high-density phones and page zoom; quality 90 keeps faces crisp. Still ~99% smaller.
const SCALE = 3;
const QUALITY = 90;

const IMAGE_TAG = /<image\b[^>]*?href="data:image\/(?:png|jpeg);base64,([A-Za-z0-9+/=]+)"[^>]*>/g;

for (const file of process.argv.slice(2)) {
	const svg = readFileSync(file, "utf8");
	let output = svg;

	for (const match of svg.matchAll(IMAGE_TAG)) {
		const tag = match[0];
		const width = Number(/\bwidth="([\d.]+)"/.exec(tag)?.[1]);
		const height = Number(/\bheight="([\d.]+)"/.exec(tag)?.[1]);
		if (!width || !height) continue;

		const source = Buffer.from(match[1], "base64");
		const jpeg = await sharp(source)
			.resize({
				width: Math.round(width * SCALE),
				height: Math.round(height * SCALE),
				fit: "cover",
				withoutEnlargement: true,
			})
			.flatten({ background: "#ffffff" })
			.jpeg({ quality: QUALITY, mozjpeg: true, chromaSubsampling: "4:4:4" })
			.toBuffer();
		if (jpeg.length >= source.length) continue;

		output = output.replace(
			match[0],
			tag.replace(
				/data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+/,
				`data:image/jpeg;base64,${jpeg.toString("base64")}`,
			),
		);
	}

	if (output !== svg) writeFileSync(file, output);
	console.log(`${file}: ${svg.length} -> ${output.length} bytes`);
}
