import type { PdfDocumentViewerHandle } from "@/features/resume/preview/preview";
import type { ResumePreviewSectionMarker } from "@/features/resume/preview/preview.shared";
import { t } from "@lingui/core/macro";
import { ArrowsOutSimpleIcon, FloppyDiskIcon, SparkleIcon } from "@phosphor-icons/react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { getRouteApi } from "@tanstack/react-router";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@headcv/utils/style";
import { LoadingScreen } from "@/components/layout/loading-screen";
import { useAiAssistant } from "@/features/resume/builder/ai-assistant";
import { ResumePreview } from "@/features/resume/preview/preview";
import { DEFAULT_PDF_PAGE_SIZE } from "@/features/resume/preview/preview.shared";
import {
	getResumePreviewSectionId,
	requestResumePreviewSection,
	useResumePreviewNavigationStore,
} from "@/features/resume/preview/preview-navigation";
import { BuilderDock } from "./dock";
import { PreviewDialog } from "./preview-dialog";
import { adjustPreviewScale, getFitWidthScale, PREVIEW_HORIZONTAL_PADDING } from "./preview-zoom";

const builderRouteApi = getRouteApi("/builder/$resumeId");
const DUPLICATE_NAVIGATION_WINDOW_MS = 250;

export function PreviewPage() {
	const viewportRef = useRef<HTMLDivElement>(null);
	const previewRef = useRef<PdfDocumentViewerHandle>(null);
	const fulfilledNavigationRequestIdRef = useRef<number | null>(null);
	const navigationRequest = useResumePreviewNavigationStore((state) => state.request);
	const [pageScale, setPageScale] = useState(0.72);
	const [zoomMode, setZoomMode] = useState<"fit-width" | "custom">("fit-width");
	const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
	const { section } = builderRouteApi.useSearch();
	const previousSection = useRef(section);

	useEffect(() => {
		if (!section || previousSection.current === section) return;
		previousSection.current = section;
		if (section !== "custom" && section !== "ai-review") {
			const targetSectionId = getResumePreviewSectionId(section);
			const currentRequest = useResumePreviewNavigationStore.getState().request;
			const isRecentDuplicate =
				currentRequest?.sectionId === targetSectionId &&
				Date.now() - currentRequest.requestedAt < DUPLICATE_NAVIGATION_WINDOW_MS;
			if (!isRecentDuplicate) requestResumePreviewSection(targetSectionId);
		}
	}, [section]);

	const navigatePreview = useCallback(
		(handle: PdfDocumentViewerHandle, request: NonNullable<typeof navigationRequest>) => {
			if (fulfilledNavigationRequestIdRef.current === request.id) return;
			handle.scrollToSection(request.sectionId, () => {
				fulfilledNavigationRequestIdRef.current = request.id;
			});
		},
		[],
	);

	const setPreviewHandle = useCallback(
		(handle: PdfDocumentViewerHandle | null) => {
			if (!handle) return;
			previewRef.current = handle;
			if (navigationRequest) navigatePreview(handle, navigationRequest);
		},
		[navigatePreview, navigationRequest],
	);

	useEffect(() => {
		if (navigationRequest && previewRef.current) navigatePreview(previewRef.current, navigationRequest);
	}, [navigatePreview, navigationRequest]);

	const calculateFitWidth = useCallback(() => {
		const viewportWidth = viewportRef.current?.clientWidth ?? 0;
		return getFitWidthScale(viewportWidth, DEFAULT_PDF_PAGE_SIZE.width, PREVIEW_HORIZONTAL_PADDING);
	}, []);

	useHotkey("Mod+S", () => {
		toast.info(t`Your changes are saved automatically.`, { id: "auto-save", icon: <FloppyDiskIcon /> });
	});

	useEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;

		const updateFitWidth = () => {
			if (zoomMode === "fit-width") setPageScale(calculateFitWidth());
		};

		updateFitWidth();
		const observer = new ResizeObserver(updateFitWidth);
		observer.observe(viewport);
		return () => observer.disconnect();
	}, [calculateFitWidth, zoomMode]);

	const adjustZoom = (direction: "in" | "out") => {
		setZoomMode("custom");
		setPageScale((current) => adjustPreviewScale(current, direction));
	};

	const fitWidth = () => {
		setZoomMode("fit-width");
		setPageScale(calculateFitWidth());
	};

	const { visibleChangedPreviewSectionIds, selectedReviewSectionId, selectReviewSection } = useAiAssistant();
	const renderSectionOverlay = useCallback(
		(marker: ResumePreviewSectionMarker) => {
			const isChanged = visibleChangedPreviewSectionIds.includes(marker.sectionId);
			const isSelected = selectedReviewSectionId === marker.sectionId;
			if (!isChanged && !isSelected) return null;

			return (
				<button
					type="button"
					className={cn(
						"pointer-events-auto absolute inset-0 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2",
						isSelected ? "bg-green-500/20 ring-2 ring-green-600" : "bg-green-500/10",
						isChanged ? "hover:bg-green-500/20" : "",
					)}
					onClick={() => selectReviewSection(marker.sectionId)}
					aria-label={`Review ${marker.sectionId} changes`}
				>
					{isSelected ? <SparkleIcon className="absolute start-1 top-1 size-3 text-green-700" weight="fill" /> : null}
				</button>
			);
		},
		[visibleChangedPreviewSectionIds, selectedReviewSectionId, selectReviewSection],
	);

	return (
		<Suspense fallback={<LoadingScreen />}>
			<div className="relative h-full min-h-0 w-full overflow-hidden bg-muted/30">
				<section
					ref={viewportRef}
					className="resume-preview-scroll h-full min-h-0 overflow-auto overscroll-contain px-6 py-8"
					aria-label={t`Resume preview`}
				>
					<div className="flex w-max min-w-full justify-center">
						<div className={cn("relative h-fit", zoomMode === "fit-width" ? "w-full" : "w-fit")}>
							<ResumePreview
								ref={setPreviewHandle}
								className={zoomMode === "fit-width" ? "w-full" : undefined}
								pageGap={18}
								pageLayout="vertical"
								pageScale={zoomMode === "fit-width" ? "page-width" : pageScale}
								showPageNumbers
								renderSectionOverlay={renderSectionOverlay}
								scrollContainerRef={viewportRef}
							/>
							<button
								type="button"
								className="group absolute inset-0 z-[5] cursor-zoom-in rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
								onClick={() => setIsPreviewDialogOpen(true)}
								aria-label={t`Open full-size resume preview`}
							>
								<span className="absolute end-3 top-3 flex size-8 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-sm ring-1 ring-foreground/10 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
									<ArrowsOutSimpleIcon className="size-4" aria-hidden="true" />
								</span>
							</button>
						</div>
					</div>
				</section>

				<PreviewDialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen} />

				<BuilderDock
					pageScale={pageScale}
					onZoomIn={() => adjustZoom("in")}
					onZoomOut={() => adjustZoom("out")}
					onFit={fitWidth}
				/>
			</div>
		</Suspense>
	);
}
