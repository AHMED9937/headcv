import type { SectionTitleResolver } from "./section-title";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleResumeData } from "@headcv/schema/resume/sample";

const rendererMock = vi.hoisted(() => ({
	pdf: vi.fn(() => ({
		toBlob: vi.fn(async () => new Blob(["%PDF"], { type: "application/pdf" })),
	})),
}));

// Mock the adapter's renderer boundary so the test never loads the full react-pdf engine.
vi.mock("./renderer", () => ({ pdf: rendererMock.pdf }));

vi.mock("./document", () => ({
	ResumeDocument: () => null,
}));

describe("createResumePdfBlob", () => {
	beforeEach(() => {
		rendererMock.pdf.mockClear();
	});

	it("renders ResumeDocument with data, template, and section title resolver", async () => {
		const resolveSectionTitle: SectionTitleResolver = (input) => input.defaultEnglishTitle ?? input.sectionId;
		const { createResumePdfBlob } = await import("./browser");

		const blob = await createResumePdfBlob({
			data: sampleResumeData,
			template: "azurill",
			resolveSectionTitle,
		});

		expect(blob.type).toBe("application/pdf");
		expect(rendererMock.pdf).toHaveBeenCalledTimes(1);
		expect(rendererMock.pdf).toHaveBeenCalledWith(
			expect.objectContaining({
				props: {
					data: sampleResumeData,
					template: "azurill",
					resolveSectionTitle,
				},
			}),
		);
	});
});
