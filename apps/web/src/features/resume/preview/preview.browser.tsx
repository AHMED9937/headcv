import type { PdfDocumentViewerHandle } from "./pdf-viewer";
import type { ResolvedResumePreviewProps } from "./preview.shared";
import { AnimatePresence, m } from "motion/react";
import { AnnotationMode } from "pdfjs-dist/legacy/build/pdf.mjs";
import { forwardRef, useEffect, useRef, useState } from "react";
import { cn } from "@headcv/utils/style";
import { createResumePdfBlob } from "@/features/resume/export/pdf-document";
import { useResumeDataForPreview } from "@/libs/inline-edit-preview-override";
import { PdfDocumentViewer } from "./pdf-viewer";
import { getResumePreviewPageCount, RESUME_PREVIEW_SECTION_MARKER_PREFIX, ResumePreviewLoader } from "./preview.shared";

type PreviewPdf = {
	file: Blob;
	id: number;
	phase: "active" | "exiting" | "staged";
};

const UPDATE_DEBOUNCE_MS = 350;
const CROSSFADE_DURATION_MS = 180;

const createPreviewPdf = (file: Blob, id: number, hasExistingPreview: boolean): PreviewPdf => ({
	file,
	id,
	phase: hasExistingPreview ? "staged" : "active",
});

const addPreviewLayer = (layers: PreviewPdf[], nextPdf: PreviewPdf) => {
	const activeLayers = layers.filter((layer) => layer.phase === "active");
	return activeLayers.length === 0 ? [nextPdf] : [...activeLayers, nextPdf];
};

const getActivePreviewLayer = (layers: PreviewPdf[]) => layers.find((layer) => layer.phase === "active") ?? null;

const promotePreviewLayer = (layers: PreviewPdf[], layerId: number) =>
	layers.map((layer) => {
		if (layer.id === layerId) return { ...layer, phase: "active" as const };
		if (layer.phase === "active") return { ...layer, phase: "exiting" as const };
		return layer;
	});

const removePreviewLayer = (layers: PreviewPdf[], layerId: number) => layers.filter((layer) => layer.id !== layerId);

export const ResumePreviewClient = forwardRef<PdfDocumentViewerHandle, ResolvedResumePreviewProps>(
	function ResumePreviewClient(
		{
			className,
			data,
			pageGap = 16,
			pageLayout,
			pageScale,
			pageClassName,
			showPageNumbers,
			renderSectionOverlay,
			scrollContainerRef,
		},
		ref,
	) {
		const builderResumeData = useResumeDataForPreview();
		const resumeData = data ?? builderResumeData;

		const [previewLayers, setPreviewLayers] = useState<PreviewPdf[]>([]);
		const [error, setError] = useState<Error | null>(null);

		const pdfIdRef = useRef(0);
		const requestIdRef = useRef(0);
		const hasPreviewRef = useRef(false);

		useEffect(() => {
			if (!resumeData) return;

			let cancelled = false;
			const abortController = new AbortController();
			const requestId = ++requestIdRef.current;
			const delay = hasPreviewRef.current ? UPDATE_DEBOUNCE_MS : 0;
			setError(null);

			const generatePdfPreview = async () => {
				try {
					if (cancelled || requestId !== requestIdRef.current) return;
					const blob = await createResumePdfBlob(resumeData, undefined, {
						purpose: "preview",
						sectionMarkerPrefix: RESUME_PREVIEW_SECTION_MARKER_PREFIX,
						signal: abortController.signal,
					});

					if (!cancelled && requestId === requestIdRef.current) {
						const nextPdf = createPreviewPdf(blob, pdfIdRef.current++, hasPreviewRef.current);

						hasPreviewRef.current = true;
						setPreviewLayers((current) => addPreviewLayer(current, nextPdf));
					}
				} catch (error) {
					if (error instanceof Error && error.name === "AbortError") return;
					console.error("Failed to generate resume preview PDF", error);
					setError(error instanceof Error ? error : new Error(String(error)));
				}
			};

			const timeoutId = window.setTimeout(() => {
				void generatePdfPreview();
			}, delay);

			return () => {
				cancelled = true;
				abortController.abort();
				window.clearTimeout(timeoutId);
			};
		}, [resumeData]);

		if (!resumeData) return null;

		if (error) {
			return (
				<div className="flex h-full items-center justify-center p-6 text-center">
					<p className="text-destructive text-sm">Unable to generate preview.</p>
				</div>
			);
		}

		const visiblePdf = getActivePreviewLayer(previewLayers);
		if (!visiblePdf) {
			return (
				<ResumePreviewLoader
					pageCount={getResumePreviewPageCount(resumeData)}
					pageClassName={pageClassName}
					pageGap={pageGap}
					pageLayout={pageLayout}
					pageScale={pageScale}
					showPageNumbers={showPageNumbers}
				/>
			);
		}

		return (
			<div dir="ltr" className={cn("grid", className)}>
				<AnimatePresence initial={false}>
					{previewLayers.map((visiblePdf) => (
						<m.div
							key={visiblePdf.id}
							aria-hidden={visiblePdf.phase !== "active"}
							className={cn(
								"col-start-1 row-start-1",
								visiblePdf.phase !== "active" && "pointer-events-none absolute inset-0",
							)}
							initial={{ opacity: visiblePdf.phase === "active" ? 1 : 0 }}
							animate={{ opacity: visiblePdf.phase === "active" ? 1 : 0 }}
							exit={{ opacity: 0 }}
							transition={{ duration: CROSSFADE_DURATION_MS / 1000, ease: "easeOut" }}
							onAnimationComplete={() => {
								if (visiblePdf.phase !== "exiting") return;
								setPreviewLayers((current) => removePreviewLayer(current, visiblePdf.id));
							}}
						>
							<PdfDocumentViewer
								ref={visiblePdf.phase === "active" ? ref : undefined}
								file={visiblePdf.file}
								annotationMode={AnnotationMode.DISABLE}
								pageClassName={pageClassName}
								pageGap={pageGap}
								pageLayout={pageLayout}
								pageScale={pageScale}
								showPageNumbers={showPageNumbers}
								renderSectionOverlay={renderSectionOverlay}
								scrollContainerRef={scrollContainerRef}
								onRenderSuccess={() => {
									if (visiblePdf.phase !== "staged") return;
									setPreviewLayers((current) => promotePreviewLayer(current, visiblePdf.id));
								}}
							/>
						</m.div>
					))}
				</AnimatePresence>
			</div>
		);
	},
);
