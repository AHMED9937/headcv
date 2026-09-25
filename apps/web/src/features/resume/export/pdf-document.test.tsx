// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultResumeData } from "@headcv/schema/resume/default";

const mocks = vi.hoisted(() => {
	class WorkerUnavailableError extends Error {
		constructor(message: string) {
			super(message);
			this.name = "PdfGenerationWorkerUnavailableError";
		}
	}

	return {
		createPdfBlob: vi.fn(async () => new Blob(["%PDF"], { type: "application/pdf" })),
		createSectionTitleResolverForLocale: vi.fn(async () => vi.fn()),
		generateResumePdfInWorker: vi.fn(async () => new Blob(["%PDF"], { type: "application/pdf" })),
		WorkerUnavailableError,
	};
});

vi.mock("./pdf-generation-client", () => ({
	generateResumePdfInWorker: mocks.generateResumePdfInWorker,
	PdfGenerationWorkerUnavailableError: mocks.WorkerUnavailableError,
}));

vi.mock("@headcv/pdf/browser", () => ({
	createResumePdfBlob: mocks.createPdfBlob,
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
		mocks.generateResumePdfInWorker.mockReset();
		mocks.generateResumePdfInWorker.mockResolvedValue(new Blob(["%PDF"], { type: "application/pdf" }));
	});

	it("normalizes the resume and generates the PDF in the worker", async () => {
		const data = structuredClone(defaultResumeData);
		data.metadata.page.locale = "ar-SA";

		await createResumePdfBlob(data, undefined, { purpose: "preview" });

		expect(mocks.generateResumePdfInWorker).toHaveBeenCalledWith(
			{
				data: expect.objectContaining({
					metadata: expect.objectContaining({
						page: expect.objectContaining({ locale: "en-US" }),
					}),
				}),
			},
			{ purpose: "preview", signal: undefined },
		);
		expect(mocks.createPdfBlob).not.toHaveBeenCalled();
		expect(data.metadata.page.locale).toBe("ar-SA");
	});

	it("falls back to main-thread generation only when workers are unavailable", async () => {
		mocks.generateResumePdfInWorker.mockRejectedValueOnce(new mocks.WorkerUnavailableError("No worker"));

		await createResumePdfBlob(structuredClone(defaultResumeData));

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
	});
});
