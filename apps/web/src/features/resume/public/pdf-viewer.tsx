import type { ResumeData } from "@headcv/schema/resume/data";
import { useEffect, useState } from "react";
import { Spinner } from "@headcv/ui/components/spinner";
import { cn } from "@headcv/utils/style";
import { createResumePdfBlob } from "@/features/resume/export/pdf-document";
import { PdfDocumentViewer } from "@/features/resume/preview/pdf-viewer";

type PdfViewerProps = {
	className?: string;
	data: ResumeData;
};

export function PdfViewer({ className, data }: PdfViewerProps) {
	const [file, setFile] = useState<Blob | null>(null);
	const [error, setError] = useState(false);

	useEffect(() => {
		let isCancelled = false;

		setFile(null);
		setError(false);
		void createResumePdfBlob(data)
			.then((blob) => {
				if (!isCancelled) setFile(blob);
			})
			.catch((cause: unknown) => {
				if (isCancelled) return;
				console.error("Failed to generate public resume PDF", cause);
				setError(true);
			});

		return () => {
			isCancelled = true;
		};
	}, [data]);

	if (error) {
		return (
			<div className={cn("flex min-h-48 items-center justify-center bg-background px-6 text-center", className)}>
				<p className="text-muted-foreground text-sm">Unable to display PDF preview.</p>
			</div>
		);
	}

	if (!file) {
		return (
			<div className={cn("flex min-h-48 items-center justify-center bg-background", className)}>
				<Spinner className="size-6" />
			</div>
		);
	}

	return <PdfDocumentViewer file={file} pageScale="page-width" className={cn("bg-neutral-100", className)} />;
}
