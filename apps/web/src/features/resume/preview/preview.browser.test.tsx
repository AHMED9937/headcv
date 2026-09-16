// @vitest-environment happy-dom

import type { ResumeData } from "@headcv/schema/resume/data";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleResumeData } from "@headcv/schema/resume/sample";
import { ResumePreviewClient } from "./preview.browser";
import { RESUME_PREVIEW_SECTION_MARKER_PREFIX } from "./preview.shared";

const previewMock = vi.hoisted(() => ({
	builderResumeData: undefined as ResumeData | undefined,
	toBlob: vi.fn(async () => new Blob(["%PDF"], { type: "application/pdf" })),
}));

const resumeDataWithPageCount = (pageCount: number): ResumeData => ({
	...sampleResumeData,
	metadata: {
		...sampleResumeData.metadata,
		layout: {
			...sampleResumeData.metadata.layout,
			pages: sampleResumeData.metadata.layout.pages.slice(0, pageCount),
		},
	},
});

vi.mock("@/features/resume/export/pdf-document", () => ({
	createResumePdfBlob: previewMock.toBlob,
}));

vi.mock("../builder/draft", () => ({
	useResumeData: () => previewMock.builderResumeData,
}));

vi.mock("./pdf-canvas", async () => {
	const React = await import("react");
	const pdfDocument = { numPages: 1 };

	return {
		PdfCanvasDocument: ({
			children,
			onLoadSuccess,
		}: {
			children: (document: typeof pdfDocument) => React.ReactNode;
			onLoadSuccess: (document: typeof pdfDocument) => void;
		}) => {
			React.useEffect(() => {
				onLoadSuccess(pdfDocument);
			}, [onLoadSuccess]);

			return React.createElement(React.Fragment, null, children(pdfDocument));
		},
		PdfCanvasPage: ({
			onLoadSuccess,
			onRenderSuccess,
			pageNumber,
			totalPages,
			renderSectionOverlay,
		}: {
			onLoadSuccess: (pageNumber: number, pageSize: { height: number; width: number }) => void;
			onRenderSuccess?: () => void;
			pageNumber: number;
			totalPages: number;
			renderSectionOverlay?: (marker: {
				sectionId: string;
				pageNumber: number;
				left: number;
				top: number;
				width: number;
				height: number;
			}) => React.ReactNode;
		}) => {
			React.useEffect(() => {
				onLoadSuccess(pageNumber, { height: 200, width: 100 });
				onRenderSuccess?.();
			}, [onLoadSuccess, onRenderSuccess, pageNumber]);

			return React.createElement(
				"div",
				{ role: "img", "aria-label": `Resume page ${pageNumber} of ${totalPages}` },
				"Rendered page",
				renderSectionOverlay?.({
					sectionId: "summary",
					pageNumber,
					left: 10,
					top: 20,
					width: 80,
					height: 40,
				}),
			);
		},
	};
});

describe("ResumePreviewClient", () => {
	beforeEach(() => {
		previewMock.builderResumeData = undefined;
		previewMock.toBlob.mockReset();
		previewMock.toBlob.mockImplementation(async () => new Blob(["%PDF"], { type: "application/pdf" }));
	});

	it("renders a loading placeholder for each builder layout page while the PDF is generated", () => {
		previewMock.builderResumeData = resumeDataWithPageCount(3);
		previewMock.toBlob.mockImplementation(() => new Promise<Blob>(() => {}));

		render(<ResumePreviewClient pageGap={16} pageLayout="vertical" pageScale={1.25} showPageNumbers={false} />);

		expect(screen.getAllByRole("img", { name: /Loading resume page/ })).toHaveLength(3);
	});

	it("renders from explicit resume data when no builder resume is active", async () => {
		render(
			<ResumePreviewClient data={sampleResumeData} pageLayout="vertical" pageScale={1.25} showPageNumbers={false} />,
		);

		const page = await screen.findByRole("img", { name: "Resume page 1 of 1" });
		expect(page.closest("[dir=ltr]")).toBeInTheDocument();

		await waitFor(() => {
			expect(previewMock.toBlob).toHaveBeenCalledTimes(1);
		});

		expect(previewMock.toBlob).toHaveBeenCalledWith(sampleResumeData, undefined, {
			sectionMarkerPrefix: RESUME_PREVIEW_SECTION_MARKER_PREFIX,
		});
	});

	it("renders section overlay content when renderSectionOverlay is provided", async () => {
		const renderSectionOverlay = vi.fn(() => <div data-testid="section-overlay">AI updated</div>);
		render(
			<ResumePreviewClient
				data={sampleResumeData}
				pageLayout="vertical"
				pageScale={1.25}
				showPageNumbers={false}
				renderSectionOverlay={renderSectionOverlay}
			/>,
		);

		await waitFor(() => {
			expect(renderSectionOverlay).toHaveBeenCalled();
		});

		expect(screen.getByTestId("section-overlay")).toBeInTheDocument();
	});
});
