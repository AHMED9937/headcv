import type { ReactNode } from "react";
import type { DesignWorkspaceSection, LeftSidebarSection } from "@/libs/resume/section";
import type { MobileBuilderView } from "./mobile-view-switch";
import type { WorkspaceTab } from "./workspace-search";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { CheckCircleIcon, DownloadSimpleIcon, FileTextIcon, PaletteIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { ScrollArea } from "@headcv/ui/components/scroll-area";
import { useAiAssistant } from "@/features/resume/builder/ai-assistant";
import { useCurrentResume } from "@/features/resume/builder/draft";
import { useIsMobile } from "@/hooks/use-mobile";
import { designWorkspaceSections, leftSidebarSections } from "@/libs/resume/section";
import { getSectionComponent as getContentSectionComponent } from "../-sidebar/left/section-components";
import { getSectionComponent as getDesignSectionComponent } from "../-sidebar/right/section-components";
import { ExportSectionBuilder } from "../-sidebar/right/sections/export";
import { useSectionStore } from "../-store/section";
import { MobileViewSwitch } from "./mobile-view-switch";
import { WorkspaceSectionNavigation, WorkspaceSectionSelect } from "./workspace-section-navigation";

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
	const isMobile = useIsMobile();
	const { hasReviewableChanges } = useAiAssistant();
	const [mobileView, setMobileView] = useState<MobileBuilderView>("editor");
	const setCollapsed = useSectionStore((state) => state.setCollapsed);
	const activeSection = tab === "content" ? section : tab === "design" ? designSection : null;
	const contentItems = useMemo<LeftSidebarSection[]>(() => {
		const base = leftSidebarSections.filter((item) => item !== "ai-review");
		if (hasReviewableChanges || section === "ai-review") return [...base, "ai-review"];
		return base;
	}, [hasReviewableChanges, section]);

	useEffect(() => {
		if (activeSection) setCollapsed(activeSection, false);
	}, [activeSection, setCollapsed]);

	const editor = (
		<div className="flex h-full min-h-0 flex-col bg-background">
			<div className="flex min-h-0 flex-1">
				{tab === "content" && (
					<WorkspaceSectionNavigation
						ariaLabel={t`Resume content`}
						description={<Trans>Select a section to edit</Trans>}
						icon={<FileTextIcon className="size-4" aria-hidden="true" />}
						items={contentItems}
						onChange={onSectionChange}
						section={section}
						status={isImported ? <Trans>Imported</Trans> : undefined}
						title={<Trans>Resume content</Trans>}
					/>
				)}

				{tab === "design" && (
					<WorkspaceSectionNavigation
						ariaLabel={t`Design your resume`}
						description={<Trans>Select a section to edit</Trans>}
						icon={<PaletteIcon className="size-4" aria-hidden="true" />}
						items={designWorkspaceSections}
						onChange={onDesignSectionChange}
						section={designSection}
						status={isImported ? <Trans>Imported</Trans> : undefined}
						title={<Trans>Design your resume</Trans>}
					/>
				)}

				<ScrollArea key={activeSection ?? tab} className="@container min-h-0 min-w-0 flex-1">
					<div className="space-y-4 p-4 sm:p-6">
						{tab === "content" && (
							<WorkspaceSectionSelect
								ariaLabel={t`Resume content`}
								items={contentItems}
								label={<Trans>Section</Trans>}
								onChange={onSectionChange}
								section={section}
							/>
						)}
						{tab === "design" && (
							<WorkspaceSectionSelect
								ariaLabel={t`Design your resume`}
								items={designWorkspaceSections}
								label={<Trans>Section</Trans>}
								onChange={onDesignSectionChange}
								section={designSection}
							/>
						)}
						{tab === "content" && getContentSectionComponent(section)}
						{tab === "design" && getDesignSectionComponent(designSection)}
						{tab === "review" && <ImportReview isImported={isImported} />}
						{tab === "export" && <ExportPanel isImported={isImported} />}
					</div>
				</ScrollArea>
			</div>
		</div>
	);

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			{isMobile ? (
				<div className="flex min-h-0 flex-1 flex-col">
					<MobileViewSwitch value={mobileView} onChange={setMobileView} />
					<div className="min-h-0 flex-1">{mobileView === "editor" ? editor : preview}</div>
				</div>
			) : (
				<div className="grid min-h-0 flex-1 grid-cols-[minmax(25rem,45%)_minmax(0,1fr)]">
					<div className="min-h-0 border-e">{editor}</div>
					<div className="min-h-0 bg-muted/30">{preview}</div>
				</div>
			)}
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
