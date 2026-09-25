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
	viewerProps: vi.fn(),
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

vi.mock("@/features/resume/builder/draft", () => ({
	useResumeData: () => previewMock.builderResumeData,
}));

vi.mock("./pdf-viewer", async () => {
	const React = await import("react");

	return {
		PdfDocumentViewer: ({
			onRenderSuccess,
			pageScale,
			renderSectionOverlay,
		}: {
			onRenderSuccess?: () => void;
			pageScale?: number | "page-width";
			renderSectionOverlay?: (marker: {
				sectionId: string;
				pageNumber: number;
				left: number;
				top: number;
				width: number;
				height: number;
			}) => React.ReactNode;
		}) => {
			previewMock.viewerProps({ pageScale });
			React.useEffect(() => {
				onRenderSuccess?.();
			}, [onRenderSuccess]);

			return React.createElement(
				"div",
				{ role: "img", "aria-label": "Resume page 1 of 1" },
				"Rendered page",
				renderSectionOverlay?.({
					sectionId: "summary",
					pageNumber: 1,
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
		previewMock.viewerProps.mockReset();
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

		expect(previewMock.toBlob).toHaveBeenCalledWith(
			sampleResumeData,
			undefined,
			expect.objectContaining({
				purpose: "preview",
				sectionMarkerPrefix: RESUME_PREVIEW_SECTION_MARKER_PREFIX,
				signal: expect.any(AbortSignal),
			}),
		);
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

	it("forwards native page-width scaling to the PDF.js viewer", async () => {
		render(
			<ResumePreviewClient
				data={sampleResumeData}
				pageLayout="vertical"
				pageScale="page-width"
				showPageNumbers={false}
			/>,
		);

		await waitFor(() => expect(previewMock.viewerProps).toHaveBeenCalledWith({ pageScale: "page-width" }));
	});
});
