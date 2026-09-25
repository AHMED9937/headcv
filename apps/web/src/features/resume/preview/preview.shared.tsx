import type { ResumeData } from "@headcv/schema/resume/data";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { Spinner } from "@headcv/ui/components/spinner";
import { cn } from "@headcv/utils/style";

export type ResumePreviewProps = {
	className?: string;
	data?: ResumeData;
	pageGap?: CSSProperties["gap"];
	pageLayout?: "horizontal" | "vertical";
	pageScale?: number | "page-width";
	pageClassName?: string;
	showPageNumbers?: boolean;
	renderSectionOverlay?: (marker: ResumePreviewSectionMarker) => ReactNode;
	scrollContainerRef?: RefObject<HTMLElement | null>;
};

export type ResumePreviewSectionMarker = {
	sectionId: string;
	pageNumber: number;
	left: number;
	top: number;
	width: number;
	height: number;
};

export const RESUME_PREVIEW_SECTION_MARKER_PREFIX = "https://resume-section.invalid/";

export type ResolvedResumePreviewProps = ResumePreviewProps & {
	pageLayout: "horizontal" | "vertical";
	pageScale: number | "page-width";
	showPageNumbers: boolean;
};

export type PreviewPageSize = {
	height: number;
	width: number;
};

type ResumePreviewLoaderProps = Pick<ResumePreviewProps, "pageClassName" | "showPageNumbers"> & {
	pageCount?: number;
	pageGap?: CSSProperties["gap"];
	pageLayout?: "horizontal" | "vertical";
	pageScale?: number | "page-width";
};

export const DEFAULT_PDF_PAGE_SIZE: PreviewPageSize = {
	height: 841.89,
	width: 595.28,
};

export const normalizeResumePreviewProps = ({
	pageGap = 16,
	pageLayout = "horizontal",
	pageScale = 1,
	showPageNumbers = false,
	...props
}: ResumePreviewProps): ResolvedResumePreviewProps => ({
	...props,
	pageGap,
	pageLayout,
	pageScale,
	showPageNumbers,
});

export const getScaledPreviewPageSize = (pageSize: PreviewPageSize, pageScale: number): PreviewPageSize => ({
	height: pageSize.height * pageScale,
	width: pageSize.width * pageScale,
});

export const getResumePreviewGapValue = (pageGap: CSSProperties["gap"]) =>
	typeof pageGap === "number" && pageGap !== 0 ? `${pageGap}px` : pageGap;

export const getResumePreviewPageCount = (data?: ResumeData) => Math.max(1, data?.metadata.layout.pages.length ?? 1);

export function ResumePreviewLoader({
	pageCount = 1,
	pageClassName,
	pageGap = 16,
	pageLayout = "horizontal",
	pageScale = 1,
	showPageNumbers = false,
}: ResumePreviewLoaderProps) {
	const numericPageScale = typeof pageScale === "number" ? pageScale : 1;
	const pageSize = getScaledPreviewPageSize(DEFAULT_PDF_PAGE_SIZE, numericPageScale);
	const resolvedPageGap = getResumePreviewGapValue(pageGap);

	return (
		<div
			style={{ "--resume-preview-page-gap": resolvedPageGap } as CSSProperties}
			className={cn(
				"flex justify-start gap-(--resume-preview-page-gap)",
				pageLayout === "horizontal" ? "flex-row items-start" : "flex-col items-center",
			)}
		>
			{Array.from({ length: pageCount }, (_, index) => {
				const pageNumber = index + 1;

				return (
					<figure key={pageNumber} className="shrink-0">
						{showPageNumbers ? (
							<figcaption className="mb-1 font-medium text-[0.625rem] text-muted-foreground">
								Page {pageNumber} of {pageCount}
							</figcaption>
						) : null}

						<div
							role="img"
							aria-label={`Loading resume page ${pageNumber} of ${pageCount}`}
							style={pageSize}
							className={cn("aspect-page overflow-hidden rounded-md bg-white", pageClassName)}
						>
							<Spinner className="size-10" />
						</div>
					</figure>
				);
			})}
		</div>
	);
}
