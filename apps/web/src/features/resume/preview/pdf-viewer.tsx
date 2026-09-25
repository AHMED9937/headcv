import type { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { CSSProperties } from "react";
import type { ResumePreviewProps, ResumePreviewSectionMarker } from "./preview.shared";
import { AnnotationMode, GlobalWorkerOptions, getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { EventBus, LinkTarget, PDFLinkService, PDFViewer, ScrollMode } from "pdfjs-dist/legacy/web/pdf_viewer.mjs";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Spinner } from "@headcv/ui/components/spinner";
import { cn } from "@headcv/utils/style";
import { getResumePreviewGapValue, RESUME_PREVIEW_SECTION_MARKER_PREFIX } from "./preview.shared";
import "pdfjs-dist/legacy/web/pdf_viewer.css";
import "./pdf-viewer.css";

export type PdfDocumentViewerHandle = {
	scrollToSection: (sectionId: string, onScrolled?: () => void) => boolean;
};

GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();

const PDF_TO_CSS_UNITS = 96 / 72;

type PdfViewerOptions = ConstructorParameters<typeof PDFViewer>[0] & {
	abortSignal: AbortSignal;
};

type RawSectionMarker = {
	pageNumber: number;
	rect: [number, number, number, number];
	sectionId: string;
};

type PositionedSectionMarker = ResumePreviewSectionMarker & {
	pageLeft: number;
	pageTop: number;
};

type ViewerMetrics = {
	height: number | null;
	markers: PositionedSectionMarker[];
	width: number | null;
};

export type PdfDocumentViewerProps = Pick<
	ResumePreviewProps,
	"className" | "pageClassName" | "pageGap" | "pageLayout" | "renderSectionOverlay" | "showPageNumbers"
> & {
	annotationMode?: number;
	file: Blob;
	onRenderSuccess?: () => void;
	pageScale?: number | "page-width";
	scrollContainerRef?: React.RefObject<HTMLElement | null>;
};

const clearPdfViewerDocument = (pdfViewer: PDFViewer) => {
	(pdfViewer.setDocument as (document: PDFDocumentProxy | null) => void)(null);
};

const getViewerScale = (pageScale: number | "page-width") =>
	pageScale === "page-width" ? pageScale : String(pageScale / PDF_TO_CSS_UNITS);

const getClassTokens = (className?: string) => className?.split(/\s+/).filter(Boolean) ?? [];

const applyPageClassName = (page: HTMLElement, pageClassName?: string) => {
	const previousClassName = page.dataset.resumePageClass;
	if (previousClassName) page.classList.remove(...getClassTokens(previousClassName));

	const nextClassNames = getClassTokens(pageClassName);
	if (nextClassNames.length > 0) {
		page.classList.add(...nextClassNames);
		page.dataset.resumePageClass = pageClassName;
	} else {
		delete page.dataset.resumePageClass;
	}
};

const getRenderedPageBounds = (pages: HTMLElement[]) => {
	if (pages.length === 0) return { height: 0, width: 0 };

	return pages.reduce(
		(bounds, page) => {
			const right = page.offsetLeft + page.offsetWidth;
			const bottom = page.offsetTop + page.offsetHeight;
			return {
				height: Math.max(bounds.height, bottom),
				width: Math.max(bounds.width, right),
			};
		},
		{ height: 0, width: 0 },
	);
};

const syncPageLabel = (page: HTMLElement, pageNumber: number, pageCount: number, showPageNumbers: boolean) => {
	const existingLabel = Array.from(page.children).find((child) => child.classList.contains("resume-pdf-page-label")) as
		| HTMLElement
		| undefined;

	if (!showPageNumbers) {
		existingLabel?.remove();
		return;
	}

	const label = existingLabel ?? document.createElement("div");
	label.className = "resume-pdf-page-label";
	label.textContent = `Page ${pageNumber} of ${pageCount}`;
	if (!existingLabel) page.append(label);
};

const readSectionMarkers = async (document: PDFDocumentProxy): Promise<RawSectionMarker[]> => {
	const markers = await Promise.all(
		Array.from({ length: document.numPages }, async (_, index) => {
			const pageNumber = index + 1;
			const page = await document.getPage(pageNumber);
			const annotations = await page.getAnnotations({ intent: "display" });

			return annotations.flatMap((annotation) => {
				if (annotation.subtype !== "Link") return [];

				const url = (annotation.url ?? annotation.unsafeUrl) as string | undefined;
				if (!url?.startsWith(RESUME_PREVIEW_SECTION_MARKER_PREFIX)) return [];

				return [
					{
						pageNumber,
						rect: annotation.rect as [number, number, number, number],
						sectionId: decodeURIComponent(url.slice(RESUME_PREVIEW_SECTION_MARKER_PREFIX.length)),
					},
				];
			});
		}),
	);

	return markers.flat();
};

export const PdfDocumentViewer = forwardRef<PdfDocumentViewerHandle, PdfDocumentViewerProps>(function PdfDocumentViewer(
	{
		annotationMode = AnnotationMode.ENABLE_FORMS,
		className,
		file,
		onRenderSuccess,
		pageClassName,
		pageGap = 16,
		pageLayout = "vertical",
		pageScale = "page-width",
		renderSectionOverlay,
		scrollContainerRef,
		showPageNumbers = false,
	},
	ref,
) {
	const rootRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const viewerRef = useRef<HTMLDivElement>(null);
	const pdfViewerRef = useRef<PDFViewer | null>(null);
	const syncLayoutRef = useRef<() => void>(() => undefined);
	const onRenderSuccessRef = useRef(onRenderSuccess);
	const settingsRef = useRef({ pageClassName, pageLayout, pageScale, showPageNumbers });
	const rawMarkersRef = useRef<RawSectionMarker[]>([]);
	const renderedPagesRef = useRef(new Set<number>());
	const hasReportedRenderRef = useRef(false);
	const pendingScrollSectionRef = useRef<{ onScrolled?: () => void; sectionId: string } | null>(null);
	const [error, setError] = useState(false);
	const [isReady, setIsReady] = useState(false);
	const [metrics, setMetrics] = useState<ViewerMetrics>({ height: null, markers: [], width: null });

	const scrollToSection = useCallback(
		(sectionId: string, onScrolled?: () => void) => {
			pendingScrollSectionRef.current = { onScrolled, sectionId };
			const container = scrollContainerRef?.current ?? containerRef.current;
			const root = rootRef.current;
			if (!container || !root) return false;

			const marker = metrics.markers.find((item) => item.sectionId === sectionId);
			if (!marker) return false;

			const containerRect = container.getBoundingClientRect();
			const rootRect = root.getBoundingClientRect();
			const rootOffset = rootRect.top + container.scrollTop - containerRect.top;
			const targetTop = rootOffset + marker.pageTop + marker.top - 16;

			container.scrollTo({ top: Math.max(0, targetTop), behavior: "auto" });
			pendingScrollSectionRef.current = null;
			onScrolled?.();
			return true;
		},
		[metrics.markers, scrollContainerRef],
	);

	useImperativeHandle(ref, () => ({ scrollToSection }), [scrollToSection]);

	useEffect(() => {
		const pending = pendingScrollSectionRef.current;
		if (pending && scrollToSection(pending.sectionId, pending.onScrolled)) pendingScrollSectionRef.current = null;
	}, [scrollToSection]);

	useEffect(() => {
		onRenderSuccessRef.current = onRenderSuccess;
		settingsRef.current = { pageClassName, pageLayout, pageScale, showPageNumbers };

		const pdfViewer = pdfViewerRef.current;
		if (!pdfViewer) return;

		pdfViewer.scrollMode = pageLayout === "horizontal" ? ScrollMode.HORIZONTAL : ScrollMode.VERTICAL;
		pdfViewer.currentScaleValue = getViewerScale(pageScale);
		pdfViewer.update();
		syncLayoutRef.current();
	}, [onRenderSuccess, pageClassName, pageLayout, pageScale, showPageNumbers]);

	useEffect(() => {
		const root = rootRef.current;
		const container = containerRef.current;
		const viewer = viewerRef.current;
		if (!root || !container || !viewer) return;

		let isCancelled = false;
		let animationFrameId = 0;
		let loadingTask: PDFDocumentLoadingTask | undefined;
		let pdfDocument: PDFDocumentProxy | undefined;
		let resizeObserver: ResizeObserver | undefined;
		const abortController = new AbortController();
		const eventBus = new EventBus();
		const linkService = new PDFLinkService({
			eventBus,
			externalLinkRel: "noreferrer",
			externalLinkTarget: LinkTarget.BLANK,
		});

		setError(false);
		setIsReady(false);
		setMetrics({ height: null, markers: [], width: null });
		rawMarkersRef.current = [];
		renderedPagesRef.current = new Set();
		hasReportedRenderRef.current = false;
		viewer.replaceChildren();

		const syncLayout = () => {
			if (isCancelled) return;
			window.cancelAnimationFrame(animationFrameId);
			animationFrameId = window.requestAnimationFrame(() => {
				if (isCancelled) return;

				const pdfViewer = pdfViewerRef.current;
				const document = pdfDocument;
				if (!pdfViewer || !document) return;

				const { pageClassName, pageScale, showPageNumbers } = settingsRef.current;
				const pageElements = Array.from(viewer.querySelectorAll<HTMLElement>(".page"));

				pageElements.forEach((page, index) => {
					const pageNumber = index + 1;
					applyPageClassName(page, pageClassName);
					syncPageLabel(page, pageNumber, document.numPages, showPageNumbers);
					page.setAttribute("aria-label", `Resume page ${pageNumber} of ${document.numPages}`);
				});

				const markers = rawMarkersRef.current.flatMap<PositionedSectionMarker>((marker) => {
					const pageView = pdfViewer.getPageView(marker.pageNumber - 1);
					const page = pageElements[marker.pageNumber - 1];
					if (!pageView?.viewport || !page) return [];

					const [x1, y1, x2, y2] = pageView.viewport.convertToViewportRectangle(marker.rect);
					return [
						{
							height: Math.abs(y2 - y1),
							left: Math.min(x1, x2),
							pageLeft: page.offsetLeft,
							pageNumber: marker.pageNumber,
							pageTop: page.offsetTop,
							sectionId: marker.sectionId,
							top: Math.min(y1, y2),
							width: Math.abs(x2 - x1),
						},
					];
				});

				const pageBounds = getRenderedPageBounds(pageElements);
				const nextHeight = Math.ceil(pageBounds.height);
				const nextWidth = typeof pageScale === "number" ? Math.ceil(pageBounds.width) : null;
				setMetrics((current) =>
					current.height === nextHeight && current.width === nextWidth && current.markers.length === markers.length
						? { ...current, markers }
						: { height: nextHeight, markers, width: nextWidth },
				);
				pdfViewer.update();
			});
		};
		syncLayoutRef.current = syncLayout;

		const onPagesInit = () => {
			const pdfViewer = pdfViewerRef.current;
			if (!pdfViewer) return;

			const { pageLayout, pageScale } = settingsRef.current;
			pdfViewer.scrollMode = pageLayout === "horizontal" ? ScrollMode.HORIZONTAL : ScrollMode.VERTICAL;
			pdfViewer.currentScaleValue = getViewerScale(pageScale);
			syncLayout();
		};
		const onPageRendered = ({ pageNumber }: { pageNumber: number }) => {
			renderedPagesRef.current.add(pageNumber);
			syncLayout();

			if (!hasReportedRenderRef.current && pdfDocument && renderedPagesRef.current.size >= pdfDocument.numPages) {
				hasReportedRenderRef.current = true;
				setIsReady(true);
				onRenderSuccessRef.current?.();
			}
		};

		eventBus.on("pagesinit", onPagesInit);
		eventBus.on("pagesloaded", syncLayout);
		eventBus.on("pagerendered", onPageRendered);
		eventBus.on("scalechanging", syncLayout);
		resizeObserver = new ResizeObserver(syncLayout);
		resizeObserver.observe(viewer);

		const loadDocument = async () => {
			const arrayBuffer = await file.arrayBuffer();
			if (isCancelled) return;

			loadingTask = getDocument({ data: new Uint8Array(arrayBuffer), docBaseUrl: window.location.href });
			const nextDocument = await loadingTask.promise;
			if (isCancelled) {
				void nextDocument.destroy();
				return;
			}

			pdfDocument = nextDocument;
			const pdfViewerOptions = {
				abortSignal: abortController.signal,
				annotationMode,
				container,
				enableDetailCanvas: true,
				enableOptimizedPartialRendering: true,
				eventBus,
				linkService,
				removePageBorders: true,
				viewer,
			} as PdfViewerOptions;
			const pdfViewer = new PDFViewer(pdfViewerOptions);
			pdfViewerRef.current = pdfViewer;
			linkService.setViewer(pdfViewer);
			pdfViewer.setDocument(nextDocument);
			linkService.setDocument(nextDocument);

			if (renderSectionOverlay) {
				rawMarkersRef.current = await readSectionMarkers(nextDocument);
				syncLayout();
			}
		};

		void loadDocument().catch((cause: unknown) => {
			if (isCancelled) return;
			console.error("Failed to render resume PDF with PDF.js", cause);
			setError(true);
		});

		return () => {
			isCancelled = true;
			eventBus.off("pagesinit", onPagesInit);
			eventBus.off("pagesloaded", syncLayout);
			eventBus.off("pagerendered", onPageRendered);
			eventBus.off("scalechanging", syncLayout);
			abortController.abort();
			window.cancelAnimationFrame(animationFrameId);
			resizeObserver?.disconnect();
			if (pdfViewerRef.current) clearPdfViewerDocument(pdfViewerRef.current);
			pdfViewerRef.current = null;
			void pdfDocument?.destroy();
			void loadingTask?.destroy();
			viewer.replaceChildren();
		};
	}, [annotationMode, file, renderSectionOverlay]);

	const resolvedPageGap = getResumePreviewGapValue(pageGap);
	const style = {
		"--resume-preview-page-gap": resolvedPageGap,
		height: metrics.height ?? undefined,
		width: metrics.width ?? undefined,
	} as CSSProperties;

	return (
		<div
			ref={rootRef}
			dir="ltr"
			style={style}
			className={cn(
				"resume-pdf-viewer relative",
				metrics.height ? "min-h-0" : "min-h-48",
				showPageNumbers && "resume-pdf-viewer--page-numbers",
				pageLayout === "horizontal" && "resume-pdf-viewer--horizontal",
				className,
			)}
		>
			<div ref={containerRef} className="absolute inset-0 overflow-visible">
				<div ref={viewerRef} className="pdfViewer" />
			</div>

			{metrics.markers.length > 0 && renderSectionOverlay ? (
				<div className="pointer-events-none absolute inset-0 z-10">
					{metrics.markers.map((marker) => (
						<div
							key={`${marker.sectionId}-${marker.pageNumber}`}
							style={{
								height: marker.height,
								left: marker.pageLeft + marker.left,
								position: "absolute",
								top: marker.pageTop + marker.top,
								width: marker.width,
							}}
						>
							{renderSectionOverlay(marker)}
						</div>
					))}
				</div>
			) : null}

			{error ? (
				<div className="absolute inset-0 flex items-center justify-center bg-background px-6 text-center text-destructive text-sm">
					Unable to display PDF preview.
				</div>
			) : isReady ? null : (
				<div className="absolute inset-0 flex items-center justify-center bg-background">
					<Spinner className="size-6" />
				</div>
			)}
		</div>
	);
});
