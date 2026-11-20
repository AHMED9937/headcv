import type { ReactNode } from "react";
import type { DesignWorkspaceSection } from "@/libs/resume/section";
import type { BuilderSearch } from "./workspace-search";
import { Trans } from "@lingui/react/macro";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@headcv/ui/components/button";
import { ScrollArea } from "@headcv/ui/components/scroll-area";
import { useDialogStore } from "@/dialogs/store";
import { BuilderStepActions } from "@/features/builder/step-actions";
import { getStepSectionId, useBuilderStep } from "@/features/builder/use-builder-step";
import { useAiAssistant } from "@/features/resume/builder/ai-assistant";
import { AiFabClearance } from "@/features/resume/builder/ai-fab-clearance";
import { useCurrentResume } from "@/features/resume/builder/draft";
import { BuilderSidebarLeft } from "../-sidebar/left";
import { AiReviewSectionBuilder } from "../-sidebar/left/sections/ai-review";
import { ExportSectionBuilder } from "../-sidebar/right/sections/export";
import { useSectionStore } from "../-store/section";
import { DesignWorkspacePanel } from "./design-workspace";
import { InlineSectionEditor } from "./inline-section-editor";
import { DEFAULT_DESIGN_SECTION } from "./workspace-search";

export function GuidedEditor() {
	const { currentStep } = useBuilderStep();
	const { section } = useSearch({ from: "/builder/$resumeId" });
	const { hasReviewableChanges } = useAiAssistant();
	const sectionId = getStepSectionId(currentStep);
	const showingInlineEditor = useDialogStore(
		(state) =>
			state.presentation === "inline" &&
			/^resume\.sections\.[^.]+\.(create|update)$/.test(state.activeDialog?.type ?? ""),
	);

	if (showingInlineEditor) {
		return (
			<GuidedScrollPanel>
				<InlineSectionEditor />
			</GuidedScrollPanel>
		);
	}
	// The AI banner's Review button targets `section=ai-review`; the step-based flow shows it in place of the step.
	if (section === "ai-review" && hasReviewableChanges) return <GuidedAiReview />;
	if (sectionId) return <BuilderSidebarLeft guided />;

	return (
		<div className="flex h-full min-h-0 flex-col bg-background">
			{currentStep === "design" ? (
				<GuidedDesign />
			) : (
				<ScrollArea className="min-h-0 flex-1">
					<div className="space-y-4 p-4">
						{currentStep === "review" && <GuidedReview />}
						{currentStep === "export" && <ExportSectionBuilder />}
						<AiFabClearance />
					</div>
				</ScrollArea>
			)}
			<BuilderStepActions />
		</div>
	);
}

/**
 * The guided pane has a fixed height, so content taller than it must scroll here rather than be clipped.
 * base-ui's ScrollArea root doesn't clip on its own; `min-h-0` lets it shrink to the pane and scroll.
 */
function GuidedScrollPanel({ children }: { children: ReactNode }) {
	return (
		<div className="flex h-full min-h-0 flex-col bg-background">
			<ScrollArea className="min-h-0 flex-1">
				<div className="space-y-4 p-4">
					{children}
					<AiFabClearance />
				</div>
			</ScrollArea>
		</div>
	);
}

function GuidedDesign() {
	const [designSection, setDesignSection] = useState<DesignWorkspaceSection>(DEFAULT_DESIGN_SECTION);

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<DesignWorkspacePanel section={designSection} onSectionChange={setDesignSection} />
		</div>
	);
}

function GuidedReview() {
	const resume = useCurrentResume();
	const checks = [
		{
			label: <Trans>Your name is present</Trans>,
			passed: Boolean(resume.data.basics.name.trim()),
		},
		{
			label: <Trans>Your headline is present</Trans>,
			passed: Boolean(resume.data.basics.headline.trim()),
		},
		{
			label: <Trans>At least one experience or education entry is present</Trans>,
			passed: resume.data.sections.experience.items.length > 0 || resume.data.sections.education.items.length > 0,
		},
		{
			label: <Trans>Your resume has at least one skill</Trans>,
			passed: resume.data.sections.skills.items.length > 0,
		},
	];

	return (
		<div className="space-y-5">
			<div className="space-y-1">
				<h2 className="font-display font-semibold text-2xl">
					<Trans>Review your resume</Trans>
				</h2>
				<p className="text-muted-foreground text-sm">
					<Trans>A quick check before you move on to design and export.</Trans>
				</p>
			</div>
			<ul className="space-y-2" aria-label="Resume review checks">
				{checks.map((check, index) => (
					<li key={index} className="flex items-center gap-3 rounded-xl border bg-background p-4">
						<span className={check.passed ? "text-success" : "text-warning"} aria-hidden="true">
							{check.passed ? "✓" : "!"}
						</span>
						<span className="text-sm">{check.label}</span>
					</li>
				))}
			</ul>
		</div>
	);
}

function GuidedAiReview() {
	const navigate = useNavigate({ from: "/builder/$resumeId" });
	const expandLeftSection = useSectionStore((state) => state.expandLeftSection);

	useEffect(() => {
		expandLeftSection("ai-review");
	}, [expandLeftSection]);

	return (
		<GuidedScrollPanel>
			<Button
				variant="ghost"
				size="sm"
				onClick={() => {
					void navigate({
						search: (previous: BuilderSearch) => ({ ...previous, section: undefined, reviewSection: undefined }),
					});
				}}
			>
				<ArrowLeftIcon aria-hidden="true" />
				<Trans>Back to step</Trans>
			</Button>
			<AiReviewSectionBuilder />
		</GuidedScrollPanel>
	);
}
