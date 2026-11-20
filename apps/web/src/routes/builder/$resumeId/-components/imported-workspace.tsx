import type { ReactNode } from "react";
import type { DesignWorkspaceSection, LeftSidebarSection } from "@/libs/resume/section";
import type { WorkspaceTab } from "./workspace-search";
import { Trans } from "@lingui/react/macro";
import { CheckCircleIcon, DownloadSimpleIcon } from "@phosphor-icons/react";
import { ScrollArea } from "@headcv/ui/components/scroll-area";
import { AiFabClearance } from "@/features/resume/builder/ai-fab-clearance";
import { useCurrentResume } from "@/features/resume/builder/draft";
import { ExportSectionBuilder } from "../-sidebar/right/sections/export";
import { ContentWorkspacePanel } from "./content-workspace";
import { DesignWorkspacePanel } from "./design-workspace";
import { BuilderSplitView } from "./split-view";

type Props = {
	tab: WorkspaceTab;
	section: LeftSidebarSection;
	designSection: DesignWorkspaceSection;
	isImported: boolean;
	onSectionChange: (section: LeftSidebarSection) => void;
	onDesignSectionChange: (section: DesignWorkspaceSection) => void;
	preview: ReactNode;
};

export function ImportedWorkspace({
	tab,
	section,
	designSection,
	isImported,
	onSectionChange,
	onDesignSectionChange,
	preview,
}: Props) {
	const editor = (
		<div className="flex h-full min-h-0 flex-col bg-background">
			{tab === "content" ? (
				<ContentWorkspacePanel section={section} onSectionChange={onSectionChange} />
			) : tab === "design" ? (
				<DesignWorkspacePanel
					section={designSection}
					onSectionChange={onDesignSectionChange}
					status={isImported ? <Trans>Imported</Trans> : undefined}
				/>
			) : (
				<ScrollArea key={tab} className="@container min-h-0 min-w-0 flex-1">
					<div className="space-y-4 p-4 sm:p-6">
						{tab === "review" && <ImportReview isImported={isImported} />}
						{tab === "export" && <ExportPanel isImported={isImported} />}
						<AiFabClearance />
					</div>
				</ScrollArea>
			)}
		</div>
	);

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<BuilderSplitView editor={editor} preview={preview} />
		</div>
	);
}

function ImportReview({ isImported }: { isImported: boolean }) {
	const resume = useCurrentResume();

	const checks = [
		{ label: <Trans>Name</Trans>, passed: Boolean(resume.data.basics.name.trim()) },
		{ label: <Trans>Headline</Trans>, passed: Boolean(resume.data.basics.headline.trim()) },
		{ label: <Trans>Contact email</Trans>, passed: Boolean(resume.data.basics.email.trim()) },
		{
			label: <Trans>Experience or education</Trans>,
			passed: resume.data.sections.experience.items.length > 0 || resume.data.sections.education.items.length > 0,
		},
	];

	return (
		<div className="space-y-5">
			<WorkspaceIntro
				icon={<CheckCircleIcon className="size-5" />}
				title={isImported ? <Trans>Review imported content</Trans> : <Trans>Review your resume</Trans>}
				description={<Trans>Check the fields that matter before you export.</Trans>}
			/>
			<div className="space-y-2">
				{checks.map((check, index) => (
					<div key={index} className="flex items-center justify-between rounded-xl border bg-background p-4 text-sm">
						<span>{check.label}</span>
						<span className={check.passed ? "text-success" : "text-warning"}>
							{check.passed ? <Trans>Ready</Trans> : <Trans>Needs review</Trans>}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

function ExportPanel({ isImported }: { isImported: boolean }) {
	return (
		<div className="space-y-5">
			<WorkspaceIntro
				icon={<DownloadSimpleIcon className="size-5" />}
				title={<Trans>Export your resume</Trans>}
				description={<Trans>Choose a format and download a polished copy.</Trans>}
				status={isImported ? <Trans>Imported</Trans> : undefined}
			/>
			<ExportSectionBuilder />
		</div>
	);
}

function WorkspaceIntro({
	icon,
	title,
	description,
	status,
}: {
	icon: ReactNode;
	title: ReactNode;
	description: ReactNode;
	status?: ReactNode;
}) {
	return (
		<div className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-start gap-3">
					<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
						{icon}
					</div>
					<div>
						<h2 className="font-display font-semibold text-2xl text-foreground">{title}</h2>
						<p className="mt-1 text-muted-foreground text-sm">{description}</p>
					</div>
				</div>
				{status && (
					<span className="rounded-full bg-background px-2.5 py-1 font-medium text-primary text-xs">{status}</span>
				)}
			</div>
		</div>
	);
}
