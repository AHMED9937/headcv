import type { ReactNode } from "react";
import type { RouterOutput } from "@/libs/orpc/client";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { DotsThreeIcon, DownloadSimpleIcon, PlusIcon } from "@phosphor-icons/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, m } from "motion/react";
import { useMemo } from "react";
import { Button } from "@headcv/ui/components/button";
import { useDialogStore } from "@/dialogs/store";
import { ResumeDropdownMenu } from "./menus/dropdown-menu";

type Resume = RouterOutput["resume"]["list"][number];

type Props = {
	resumes: Resume[];
};

export function ListView({ resumes }: Props) {
	const navigate = useNavigate();
	const { openDialog } = useDialogStore();

	const handleCreateResume = () => {
		void navigate({ to: "/templates" });
	};

	const handleImportResume = () => {
		openDialog("resume.import", undefined);
	};

	return (
		<div className="flex flex-col gap-y-1">
			<m.div
				className="will-change-[transform,opacity]"
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -20 }}
				transition={{ duration: 0.2, ease: "easeOut" }}
			>
				<Button
					size="lg"
					variant="ghost"
					className="h-12 w-full justify-start gap-x-4 text-start"
					onClick={handleCreateResume}
				>
					<PlusIcon />
					<RowLabel
						title={<Trans>Create a new resume</Trans>}
						description={<Trans>Start building your resume from scratch</Trans>}
					/>
				</Button>
			</m.div>

			<m.div
				className="will-change-[transform,opacity]"
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -20 }}
				transition={{ duration: 0.2, delay: 0.03, ease: "easeOut" }}
			>
				<Button
					size="lg"
					variant="ghost"
					className="h-12 w-full justify-start gap-x-4 text-start"
					onClick={handleImportResume}
				>
					<DownloadSimpleIcon />
					<RowLabel
						title={<Trans>Import an existing resume</Trans>}
						description={<Trans>Continue where you left off</Trans>}
					/>
				</Button>
			</m.div>

			<AnimatePresence initial={false} mode="popLayout">
				{resumes?.map((resume, index) => (
					<m.div
						layout
						key={resume.id}
						className="will-change-[transform,opacity]"
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						transition={{ duration: 0.18, delay: Math.min(0.12, (index + 2) * 0.02), ease: "easeOut" }}
					>
						<ResumeListItem resume={resume} />
					</m.div>
				))}
			</AnimatePresence>
		</div>
	);
}

/**
 * Row title + secondary line. Buttons are `whitespace-nowrap`, so both lines must be able to shrink and
 * truncate: stacked on phones, aligned in columns from `sm` up.
 */
function RowLabel({ title, description }: { title: ReactNode; description: ReactNode }) {
	return (
		<span className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:gap-x-4">
			<span className="truncate sm:min-w-80">{title}</span>
			<span className="truncate text-xs opacity-60">{description}</span>
		</span>
	);
}

function ResumeListItem({ resume }: { resume: Resume }) {
	const { i18n } = useLingui();

	const updatedAt = useMemo(() => {
		return Intl.DateTimeFormat(i18n.locale, { dateStyle: "long", timeStyle: "short" }).format(resume.updatedAt);
	}, [i18n.locale, resume.updatedAt]);

	return (
		<div className="flex items-center gap-x-2">
			<Button
				size="lg"
				variant="ghost"
				nativeButton={false}
				className="h-12 w-full min-w-0 flex-1 justify-start gap-x-4 text-start"
				render={
					<Link to="/builder/$resumeId" params={{ resumeId: resume.id }}>
						<div className="size-3" />
						<RowLabel title={resume.name} description={<Trans>Last updated on {updatedAt}</Trans>} />
					</Link>
				}
			/>

			<ResumeDropdownMenu resume={resume} align="end">
				<Button size="icon" variant="ghost" className="size-12">
					<DotsThreeIcon />
				</Button>
			</ResumeDropdownMenu>
		</div>
	);
}
