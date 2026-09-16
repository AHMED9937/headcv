import type { Icon } from "@phosphor-icons/react";
import { t } from "@lingui/core/macro";
import {
	ChatCircleDotsIcon,
	CircleNotchIcon,
	CubeFocusIcon,
	FileDocIcon,
	FileJsIcon,
	FilePdfIcon,
	LinkSimpleIcon,
	MagnifyingGlassMinusIcon,
	MagnifyingGlassPlusIcon,
} from "@phosphor-icons/react";
import { m } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";
import { buildDocx } from "@headcv/docx";
import { Button } from "@headcv/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@headcv/ui/components/tooltip";
import { downloadWithAnchor, generateFilename } from "@headcv/utils/file";
import { cn } from "@headcv/utils/style";
import { useAiAssistant } from "@/features/resume/builder/ai-assistant";
import { useCurrentResume } from "@/features/resume/builder/draft";
import { createResumePdfBlob } from "@/features/resume/export/pdf-document";
import { authClient } from "@/libs/auth/client";
import { formatPreviewScale } from "./preview-zoom";

type BuilderDockProps = {
	pageScale: number;
	onZoomIn: () => void;
	onZoomOut: () => void;
	onFit: () => void;
};

export function BuilderDock({ pageScale, onZoomIn, onZoomOut, onFit }: BuilderDockProps) {
	const { data: session } = authClient.useSession();
	const resume = useCurrentResume();
	const { openThreads } = useAiAssistant();

	const [_, copyToClipboard] = useCopyToClipboard();
	const [isPrinting, setIsPrinting] = useState(false);

	const publicUrl = useMemo(() => {
		if (!session?.user.username || !resume?.slug) return "";
		return `${window.location.origin}/${session.user.username}/${resume.slug}`;
	}, [session?.user.username, resume?.slug]);

	const onCopyUrl = useCallback(async () => {
		await copyToClipboard(publicUrl);
		toast.success(t`A link to your resume has been copied to clipboard.`);
	}, [publicUrl, copyToClipboard]);

	const onDownloadJSON = useCallback(async () => {
		if (!resume) return;
		const filename = generateFilename(resume.name, "json");
		const jsonString = JSON.stringify(resume.data, null, 2);
		const blob = new Blob([jsonString], { type: "application/json" });

		downloadWithAnchor(blob, filename);
	}, [resume]);

	const onDownloadDOCX = useCallback(async () => {
		if (!resume) return;
		const filename = generateFilename(resume.name, "docx");

		try {
			const blob = await buildDocx(resume.data);
			downloadWithAnchor(blob, filename);
		} catch {
			toast.error(t`There was a problem while generating the DOCX, please try again.`);
		}
	}, [resume]);

	const onDownloadPDF = useCallback(async () => {
		if (!resume) return;

		const filename = generateFilename(resume.name, "pdf");
		const toastId = toast.loading(t`Please wait while your PDF is being generated...`);

		setIsPrinting(true);

		try {
			const blob = await createResumePdfBlob(resume.data);
			downloadWithAnchor(blob, filename);
		} catch {
			toast.error(t`There was a problem while generating the PDF, please try again.`);
		} finally {
			setIsPrinting(false);
			toast.dismiss(toastId);
		}
	}, [resume]);

	return (
		<div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center">
			<m.div
				initial={{ opacity: 0, y: -18 }}
				animate={{ opacity: 0.6, y: 0 }}
				whileHover={{ opacity: 1, y: -2, scale: 1.01 }}
				transition={{ duration: 0.2, ease: "easeOut" }}
				className="flex items-center rounded-r-full rounded-l-full bg-popover px-2 shadow-xl will-change-[transform,opacity]"
			>
				<DockIcon icon={MagnifyingGlassMinusIcon} title={t`Zoom out`} onClick={onZoomOut} />
				<span className="min-w-12 text-center font-medium text-xs tabular-nums" aria-live="polite">
					{formatPreviewScale(pageScale)}
				</span>
				<DockIcon icon={MagnifyingGlassPlusIcon} title={t`Zoom in`} onClick={onZoomIn} />
				<DockIcon icon={CubeFocusIcon} title={t`Fit width`} onClick={onFit} />
				<DockIcon
					icon={ChatCircleDotsIcon}
					title={t`Open AI assistant`}
					onClick={() => {
						if (!resume) return;
						openThreads();
					}}
				/>
				<div className="mx-1 h-8 w-px bg-border" />
				<DockIcon icon={LinkSimpleIcon} title={t`Copy URL`} onClick={() => onCopyUrl()} />
				<DockIcon icon={FileJsIcon} title={t`Download JSON`} onClick={() => onDownloadJSON()} />
				<DockIcon icon={FileDocIcon} title={t`Download DOCX`} onClick={() => onDownloadDOCX()} />
				<DockIcon
					title={t`Download PDF`}
					disabled={isPrinting}
					onClick={() => onDownloadPDF()}
					icon={isPrinting ? CircleNotchIcon : FilePdfIcon}
					iconClassName={cn(isPrinting && "animate-spin")}
				/>
			</m.div>
		</div>
	);
}

type DockIconProps = {
	title: string;
	icon: Icon;
	disabled?: boolean;
	onClick: () => void;
	iconClassName?: string;
	active?: boolean;
};

function DockIcon({ icon: Icon, title, disabled, onClick, iconClassName, active }: DockIconProps) {
	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<m.div
						className="will-change-transform"
						whileHover={disabled ? undefined : { y: -1, scale: 1.04 }}
						whileTap={disabled ? undefined : { scale: 0.97 }}
						transition={{ duration: 0.15, ease: "easeOut" }}
					>
						<Button
							size="icon"
							variant="ghost"
							disabled={disabled}
							className={cn(active && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary")}
							onClick={onClick}
							aria-label={title}
						>
							<Icon className={cn("size-4", iconClassName)} />
						</Button>
					</m.div>
				}
			/>

			<TooltipContent side="top" align="center" className="font-medium">
				{title}
			</TooltipContent>
		</Tooltip>
	);
}
