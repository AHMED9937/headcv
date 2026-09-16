import { readFileSync, writeFileSync } from "node:fs";

// Embed the standalone portrait so the SVG also works in an <img> and offline.
// Only the photograph remains raster; all lettering and dividers are vector.
const source = readFileSync(new URL("hero-preview.svg", import.meta.url), "utf8");
const photo = readFileSync(new URL("../apps/web/public/templates/hero-male-portrait.png", import.meta.url));
const output = source.replace("{{PORTRAIT_SOURCE}}", `data:image/png;base64,${photo.toString("base64")}`);
writeFileSync(new URL("../apps/web/public/templates/chikorita-hero-vector.svg", import.meta.url), output);
console.log("Built scalable hero preview with embedded portrait.");
