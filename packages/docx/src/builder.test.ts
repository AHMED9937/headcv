// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import { Document } from "docx";
import { defaultResumeData } from "@headcv/schema/resume/default";
import { sampleResumeData } from "@headcv/schema/resume/sample";
import { buildDocument } from "./builder";

describe("buildDocument", () => {
	it("returns a docx Document instance for the default resume", () => {
		const doc = buildDocument(defaultResumeData);
		expect(doc).toBeInstanceOf(Document);
	});

	it("returns a docx Document instance for the sample resume", () => {
		const doc = buildDocument(sampleResumeData);
		expect(doc).toBeInstanceOf(Document);
	});

	it("handles a resume with no layout pages without throwing", () => {
		const data = structuredClone(defaultResumeData);
		data.metadata.layout.pages = [];

		expect(() => buildDocument(data)).not.toThrow();
	});

	it("supports both a4 and letter page formats", () => {
		const a4Data = structuredClone(defaultResumeData);
		a4Data.metadata.page.format = "a4";
		expect(buildDocument(a4Data)).toBeInstanceOf(Document);

		const letterData = structuredClone(defaultResumeData);
		letterData.metadata.page.format = "letter";
		expect(buildDocument(letterData)).toBeInstanceOf(Document);
	});

	it("handles a full-width single page layout", () => {
		const data = structuredClone(defaultResumeData);
		data.metadata.layout.pages = [
			{
				fullWidth: true,
				main: ["experience", "education"],
				sidebar: [],
			},
		];
		expect(() => buildDocument(data)).not.toThrow();
	});

	it("handles a sidebar layout (main + sidebar split)", () => {
		const data = structuredClone(defaultResumeData);
		data.metadata.layout.pages = [
			{
				fullWidth: false,
				main: ["experience", "education"],
				sidebar: ["skills", "languages"],
			},
		];
		expect(() => buildDocument(data)).not.toThrow();
	});

	it("falls back to default colors when the primary color is unparseable", () => {
		const data = structuredClone(defaultResumeData);
		data.metadata.design.colors.primary = "not-a-color";
		expect(() => buildDocument(data)).not.toThrow();
	});

	it("falls back to a default font when fontFamily is empty", () => {
		const data = structuredClone(defaultResumeData);
		data.metadata.typography.body.fontFamily = "";
		data.metadata.typography.heading.fontFamily = "";
		expect(() => buildDocument(data)).not.toThrow();
	});

	it("embeds the profile photo when one is supplied", () => {
		const picture = {
			data: new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer,
			type: "png" as const,
			widthPx: 96,
			heightPx: 96,
			rotation: 0,
		};
		expect(() => buildDocument(defaultResumeData, picture)).not.toThrow();
	});

	it("omits the photo when none is supplied", () => {
		expect(() => buildDocument(defaultResumeData, null)).not.toThrow();
	});
});
