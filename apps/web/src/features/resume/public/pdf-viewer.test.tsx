// @vitest-environment happy-dom

import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleResumeData } from "@headcv/schema/resume/sample";

const pdfViewerMock = vi.hoisted(() => ({
	createResumePdfBlob: vi.fn(async () => new Blob(["%PDF"], { type: "application/pdf" })),
	viewerProps: [] as Array<{ className?: string; file: Blob; pageScale?: number | "page-width" }>,
}));

vi.mock("@/features/resume/export/pdf-document", () => ({
	createResumePdfBlob: pdfViewerMock.createResumePdfBlob,
}));

vi.mock("@/features/resume/preview/pdf-viewer", () => ({
	PdfDocumentViewer: (props: { className?: string; file: Blob; pageScale?: number | "page-width" }) => {
		pdfViewerMock.viewerProps.push(props);
		return <div data-testid="shared-pdf-viewer" />;
	},
}));

const { PdfViewer } = await import("./pdf-viewer");

beforeEach(() => {
	pdfViewerMock.createResumePdfBlob.mockClear();
	pdfViewerMock.viewerProps.length = 0;
});

describe("PdfViewer", () => {
	it("generates the PDF and delegates rendering to the shared page-width viewer", async () => {
		render(<PdfViewer data={sampleResumeData} className="public-preview" />);

		await waitFor(() => expect(pdfViewerMock.viewerProps).toHaveLength(1));
		expect(pdfViewerMock.createResumePdfBlob).toHaveBeenCalledWith(sampleResumeData);
		expect(pdfViewerMock.viewerProps[0]).toMatchObject({
			className: expect.stringContaining("public-preview"),
			file: expect.any(Blob),
			pageScale: "page-width",
		});
	});
});
