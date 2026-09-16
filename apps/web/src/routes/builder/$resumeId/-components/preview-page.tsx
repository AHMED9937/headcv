import type { ResumePreviewSectionMarker } from "@/features/resume/preview/preview.shared";
import { t } from "@lingui/core/macro";
import { FloppyDiskIcon, SparkleIcon } from "@phosphor-icons/react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@headcv/utils/style";
import { LoadingScreen } from "@/components/layout/loading-screen";
import { useAiAssistant } from "@/features/resume/builder/ai-assistant";
import { ResumePreview } from "@/features/resume/preview/preview";
import { DEFAULT_PDF_PAGE_SIZE } from "@/features/resume/preview/preview.shared";
import { BuilderDock } from "./dock";
import { adjustPreviewScale, getFitWidthScale, PREVIEW_HORIZONTAL_PADDING } from "./preview-zoom";

export function PreviewPage() {
	const viewportRef = useRef<HTMLDivElement>(null);
	const [pageScale, setPageScale] = useState(0.72);
	const [zoomMode, setZoomMode] = useState<"fit-width" | "custom">("fit-width");

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
			<div className="relative h-full min-h-0 w-full bg-muted/30">
				<section ref={viewportRef} className="h-full min-h-0 overflow-auto px-6 py-8" aria-label={t`Resume preview`}>
					<div className="flex min-h-full w-max min-w-full justify-center">
						<ResumePreview
							pageGap={18}
							pageLayout="vertical"
							pageScale={pageScale}
							showPageNumbers
							renderSectionOverlay={renderSectionOverlay}
						/>
					</div>
				</section>

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
