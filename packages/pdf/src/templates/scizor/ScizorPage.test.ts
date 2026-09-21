import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SCIZOR_VISUAL_CONTRACT } from "./visual-contract";

describe("ScizorPage", () => {
	it("does not override configured text color with the template muted gray", () => {
		const source = readFileSync(fileURLToPath(new URL("./ScizorPage.tsx", import.meta.url)), "utf8");

		expect(source).not.toMatch(/color:\s*muted/);
	});

	it("keeps the approved executive-line hierarchy within readable bounds", () => {
		expect(SCIZOR_VISUAL_CONTRACT.headerNameScale).toBeGreaterThanOrEqual(2);
		expect(SCIZOR_VISUAL_CONTRACT.contactTextScale).toBeGreaterThanOrEqual(0.8);
		expect(SCIZOR_VISUAL_CONTRACT.sectionHeadingScale).toBeGreaterThanOrEqual(0.85);
		expect(SCIZOR_VISUAL_CONTRACT.dateRailWidth).toBe("22%");
	});

	it("uses heading-level rules instead of a decorative page-top stripe", () => {
		const source = readFileSync(fileURLToPath(new URL("./ScizorPage.tsx", import.meta.url)), "utf8");

		expect(source).toContain("SCIZOR_VISUAL_CONTRACT.sectionRuleWidth");
		expect(source).not.toContain("borderTopWidth: metrics.gapY");
	});

	it("opts into the Executive date rail without changing other templates", () => {
		const source = readFileSync(fileURLToPath(new URL("./ScizorPage.tsx", import.meta.url)), "utf8");

		expect(source).toContain("dateRailItemLayout: true");
		expect(source).toContain("SCIZOR_VISUAL_CONTRACT.dateRailWidth");
	});

	it("uses an underlined heading block and keeps entries together across pages", () => {
		const source = readFileSync(fileURLToPath(new URL("./ScizorPage.tsx", import.meta.url)), "utf8");

		expect(source).toContain("sectionHeadingRuleBelow: true");
		expect(source).toContain("keepSectionItemsTogether: true");
		expect(source).toContain("borderBottomWidth: SCIZOR_VISUAL_CONTRACT.sectionRuleWidth");
	});
});
