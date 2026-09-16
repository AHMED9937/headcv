// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultResumeData } from "@headcv/schema/resume/default";

const mocks = vi.hoisted(() => ({
	createPdfBlob: vi.fn(async () => new Blob(["%PDF"], { type: "application/pdf" })),
	createSectionTitleResolverForLocale: vi.fn(async () => vi.fn()),
}));

vi.mock("@headcv/pdf/browser", () => ({
	createResumePdfBlob: mocks.createPdfBlob,
}));

vi.mock("@headcv/pdf/document", () => ({
	ResumeDocument: vi.fn(),
}));

vi.mock("@/libs/resume/section-title-locale", () => ({
	createSectionTitleResolverForLocale: mocks.createSectionTitleResolverForLocale,
	useSectionTitleResolver: vi.fn(),
}));

const { createResumePdfBlob } = await import("./pdf-document");

describe("createResumePdfBlob", () => {
	beforeEach(() => {
		mocks.createPdfBlob.mockClear();
		mocks.createSectionTitleResolverForLocale.mockClear();
	});

	it("isolates an English resume from an Arabic application locale", async () => {
		const data = structuredClone(defaultResumeData);
		data.metadata.page.locale = "ar-SA";

		await createResumePdfBlob(data);

		expect(mocks.createSectionTitleResolverForLocale).toHaveBeenCalledWith("en-US");
		expect(mocks.createPdfBlob).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					metadata: expect.objectContaining({
						page: expect.objectContaining({ locale: "en-US" }),
					}),
				}),
				sectionMarkerPrefix: undefined,
			}),
		);
		expect(data.metadata.page.locale).toBe("ar-SA");
	});
});
