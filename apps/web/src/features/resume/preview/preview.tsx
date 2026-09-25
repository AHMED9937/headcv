import type { PdfDocumentViewerHandle } from "./pdf-viewer";
import type { ResumePreviewProps } from "./preview.shared";
import { forwardRef, lazy, Suspense } from "react";
import { useIsClient } from "usehooks-ts";
import { useResumeData } from "../builder/draft";
import { getResumePreviewPageCount, normalizeResumePreviewProps, ResumePreviewLoader } from "./preview.shared";

const ResumePreviewClient = lazy(() =>
	import("./preview.browser").then((module) => ({ default: module.ResumePreviewClient })),
);

export type { PdfDocumentViewerHandle, ResumePreviewProps };

export const ResumePreview = forwardRef<PdfDocumentViewerHandle, ResumePreviewProps>(
	function ResumePreview(props, ref) {
		const isClient = useIsClient();
		const resolvedProps = normalizeResumePreviewProps(props);
		const builderResumeData = useResumeData();
		const resumeData = resolvedProps.data ?? builderResumeData;
		const pageCount = getResumePreviewPageCount(resumeData);

		if (!isClient) {
			return (
				<ResumePreviewLoader
					pageCount={pageCount}
					pageClassName={resolvedProps.pageClassName}
					pageGap={resolvedProps.pageGap}
					pageLayout={resolvedProps.pageLayout}
					pageScale={resolvedProps.pageScale}
					showPageNumbers={resolvedProps.showPageNumbers}
				/>
			);
		}

		return (
			<Suspense
				fallback={
					<ResumePreviewLoader
						pageCount={pageCount}
						pageClassName={resolvedProps.pageClassName}
						pageGap={resolvedProps.pageGap}
						pageLayout={resolvedProps.pageLayout}
						pageScale={resolvedProps.pageScale}
						showPageNumbers={resolvedProps.showPageNumbers}
					/>
				}
			>
				<ResumePreviewClient ref={ref} {...resolvedProps} />
			</Suspense>
		);
	},
);
