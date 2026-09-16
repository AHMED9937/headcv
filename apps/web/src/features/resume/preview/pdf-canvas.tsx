import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { ReactNode } from "react";
import type { PreviewPageSize, ResumePreviewSectionMarker } from "./preview.shared";
import {
	AnnotationMode,
	GlobalWorkerOptions,
	getDocument,
	RenderingCancelledException,
} from "pdfjs-dist/legacy/build/pdf.mjs";
import { useEffect, useRef, useState } from "react";
import { cn } from "@headcv/utils/style";
import {
	DEFAULT_PDF_PAGE_SIZE,
	getPreviewCanvasScale,
	getScaledPreviewPageSize,
	RESUME_PREVIEW_SECTION_MARKER_PREFIX,
} from "./preview.shared";

GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();

type PdfCanvasDocumentProps = {
	children: (document: PDFDocumentProxy) => ReactNode;
	file: Blob;
	onLoadSuccess: (document: PDFDocumentProxy) => void;
};

type PdfCanvasPageProps = {
	className?: string;
	document: PDFDocumentProxy;
	onLoadSuccess: (pageNumber: number, pageSize: PreviewPageSize) => void;
	onRenderSuccess?: () => void;
	pageNumber: number;
	pageScale: number;
	pageSize?: PreviewPageSize;
	renderSectionOverlay?: (marker: ResumePreviewSectionMarker) => ReactNode;
	showPageNumbers: boolean;
	totalPages: number;
};

const isRenderingCancelledError = (error: unknown) =>
	error instanceof RenderingCancelledException ||
	(typeof error === "object" && error !== null && "name" in error && error.name === "RenderingCancelledException");

export function PdfCanvasDocument({ children, file, onLoadSuccess }: PdfCanvasDocumentProps) {
	const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
	const onLoadSuccessRef = useRef(onLoadSuccess);

	useEffect(() => {
		onLoadSuccessRef.current = onLoadSuccess;
	}, [onLoadSuccess]);

	useEffect(() => {
		let isCancelled = false;
		let loadingTask: PDFDocumentLoadingTask | undefined;
		let loadedDocument: PDFDocumentProxy | undefined;

		const loadDocument = async () => {
			setDocument(null);
			if (isCancelled) return;

			const arrayBuffer = await file.arrayBuffer();

			if (!isCancelled) {
				loadingTask = getDocument({ data: new Uint8Array(arrayBuffer) });
				const pdfDocument = await loadingTask.promise;

				if (isCancelled) {
					void pdfDocument.destroy();
				} else {
					loadedDocument = pdfDocument;
					setDocument(pdfDocument);
					onLoadSuccessRef.current(pdfDocument);
				}
			}
		};

		void loadDocument().catch((error: unknown) => {
			if (isCancelled) return;

			console.error("Failed to load PDF document", error);
		});

		return () => {
			isCancelled = true;

			if (loadedDocument) {
				void loadedDocument.destroy();
			} else if (loadingTask) {
				void loadingTask.destroy();
			}
		};
	}, [file]);

	if (!document) return null;

	return children(document);
}

export function PdfCanvasPage({
	className,
	document,
	onLoadSuccess,
	onRenderSuccess,
	pageNumber,
	pageScale,
	pageSize = DEFAULT_PDF_PAGE_SIZE,
	renderSectionOverlay,
	showPageNumbers,
	totalPages,
}: PdfCanvasPageProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const onLoadSuccessRef = useRef(onLoadSuccess);
	const onRenderSuccessRef = useRef(onRenderSuccess);
	const scaledPageSize = getScaledPreviewPageSize(pageSize, pageScale);
	const [markers, setMarkers] = useState<ResumePreviewSectionMarker[]>([]);

	useEffect(() => {
		onLoadSuccessRef.current = onLoadSuccess;
		onRenderSuccessRef.current = onRenderSuccess;
	}, [onLoadSuccess, onRenderSuccess]);

	useEffect(() => {
		let isCancelled = false;
		let renderTask: RenderTask | undefined;

		const renderPage = async () => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			const page = await document.getPage(pageNumber);

			try {
				if (isCancelled) {
					page.cleanup();
					return;
				}

				const baseViewport = page.getViewport({ scale: 1 });
				const pageSize = { height: baseViewport.height, width: baseViewport.width };
				const annotations = await page.getAnnotations({ intent: "display" });

				const nextMarkers: ResumePreviewSectionMarker[] = [];
				for (const annotation of annotations) {
					if (annotation.subtype !== "Link") continue;

					const url = (annotation.url ?? annotation.unsafeUrl) as string | undefined;
					if (!url?.startsWith(RESUME_PREVIEW_SECTION_MARKER_PREFIX)) continue;

					const [x1, y1, x2, y2] = annotation.rect as [number, number, number, number];
					const sectionId = decodeURIComponent(url.slice(RESUME_PREVIEW_SECTION_MARKER_PREFIX.length));
					nextMarkers.push({
						sectionId,
						pageNumber,
						left: x1 * pageScale,
						top: (baseViewport.height - y2) * pageScale,
						width: (x2 - x1) * pageScale,
						height: (y2 - y1) * pageScale,
					});
				}
				setMarkers(nextMarkers);

				onLoadSuccessRef.current(pageNumber, pageSize);

				const width = baseViewport.width * pageScale;
				const height = baseViewport.height * pageScale;
				const renderScale = getPreviewCanvasScale(width, height);
				const canvasContext = canvas.getContext("2d");

				if (!canvasContext) return;

				canvas.style.cssText = `width: ${width}px; height: ${height}px;`;
				canvas.width = Math.floor(width * renderScale);
				canvas.height = Math.floor(height * renderScale);

				canvasContext.setTransform(1, 0, 0, 1, 0, 0);
				canvasContext.clearRect(0, 0, canvas.width, canvas.height);

				const viewport = page.getViewport({ scale: pageScale });
				const transform = [renderScale, 0, 0, renderScale, 0, 0];

				renderTask = page.render({
					canvas,
					canvasContext,
					viewport,
					transform,
					annotationMode: AnnotationMode.DISABLE,
					background: "white",
				});

				await renderTask.promise;
				renderTask = undefined;

				if (!isCancelled) onRenderSuccessRef.current?.();
			} finally {
				page.cleanup();
			}
		};

		void renderPage().catch((error: unknown) => {
			if (isRenderingCancelledError(error)) return;

			console.error(`Failed to render PDF page ${pageNumber}`, error);
		});

		return () => {
			isCancelled = true;

			if (renderTask) {
				renderTask.cancel();
			}
		};
	}, [document, pageNumber, pageScale]);

	return (
		<figure className="shrink-0">
			{showPageNumbers ? (
				<figcaption className="mb-1 font-medium text-[0.625rem] text-muted-foreground">
					Page {pageNumber} of {totalPages}
				</figcaption>
			) : null}

			<div
				role="img"
				aria-label={`Resume page ${pageNumber} of ${totalPages}`}
				style={scaledPageSize}
				className={cn("relative aspect-page overflow-hidden rounded-md", className)}
			>
				<canvas ref={canvasRef} className="block size-full" />
				{markers.length > 0 && renderSectionOverlay ? (
					<div className="pointer-events-none absolute inset-0 z-10">
						{markers.map((marker) => (
							<div
								key={`${marker.sectionId}-${marker.pageNumber}`}
								style={{
									position: "absolute",
									left: marker.left,
									top: marker.top,
									width: marker.width,
									height: marker.height,
								}}
							>
								{renderSectionOverlay(marker)}
							</div>
						))}
					</div>
				) : null}
			</div>
		</figure>
	);
}
