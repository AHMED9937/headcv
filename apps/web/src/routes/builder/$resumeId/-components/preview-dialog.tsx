import { t } from "@lingui/core/macro";
import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@headcv/ui/components/dialog";
import { ResumePreview } from "@/features/resume/preview/preview";
import { DEFAULT_PDF_PAGE_SIZE } from "@/features/resume/preview/preview.shared";

const TARGET_DIALOG_WIDTH = 880;
const DIALOG_VIEWPORT_MARGIN = 32;

export const getDialogPageScale = (viewportWidth: number) =>
	Math.max(1, Math.min(TARGET_DIALOG_WIDTH, viewportWidth - DIALOG_VIEWPORT_MARGIN)) / DEFAULT_PDF_PAGE_SIZE.width;

type PreviewDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function PreviewDialog({ open, onOpenChange }: PreviewDialogProps) {
	const [pageScale, setPageScale] = useState(TARGET_DIALOG_WIDTH / DEFAULT_PDF_PAGE_SIZE.width);

	const updatePageScale = useCallback(() => {
		setPageScale(getDialogPageScale(document.documentElement.clientWidth));
	}, []);

	useEffect(() => {
		if (!open) return;

		updatePageScale();
		window.addEventListener("resize", updatePageScale);
		return () => window.removeEventListener("resize", updatePageScale);
	}, [open, updatePageScale]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="h-[calc(100svh-2rem)] w-[calc(100vw-2rem)]! max-w-[55rem]! overflow-hidden rounded-sm bg-transparent p-0 ring-0"
				overlayClassName="bg-black/45 backdrop-blur-sm"
				closeButtonClassName="fixed inset-e-2 top-2 z-60 size-10 rounded-full bg-background shadow-md ring-1 ring-foreground/10 hover:bg-background"
			>
				<DialogTitle className="sr-only">{t`Resume preview`}</DialogTitle>
				<DialogDescription className="sr-only">{t`Full-size preview of your resume.`}</DialogDescription>

				<section
					className="h-full overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
					aria-label={t`Full-size resume preview`}
				>
					<div className="min-h-full w-full">
						<ResumePreview
							className="w-full"
							pageGap={18}
							pageLayout="vertical"
							pageScale={pageScale}
							pageClassName="rounded-none!"
						/>
					</div>
				</section>
			</DialogContent>
		</Dialog>
	);
}
