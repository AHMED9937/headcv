import { Trans } from "@lingui/react/macro";
import { ScrollArea } from "@headcv/ui/components/scroll-area";
import { BuilderStepActions } from "@/features/builder/step-actions";
import { getStepSectionId, useBuilderStep } from "@/features/builder/use-builder-step";
import { useCurrentResume } from "@/features/resume/builder/draft";
import { BuilderSidebarLeft } from "../-sidebar/left";
import { DesignSectionBuilder } from "../-sidebar/right/sections/design";
import { ExportSectionBuilder } from "../-sidebar/right/sections/export";
import { PageSectionBuilder } from "../-sidebar/right/sections/page";
import { TemplateSectionBuilder } from "../-sidebar/right/sections/template";
import { TypographySectionBuilder } from "../-sidebar/right/sections/typography";

export function GuidedEditor() {
	const { currentStep } = useBuilderStep();
	const sectionId = getStepSectionId(currentStep);

	if (sectionId) return <BuilderSidebarLeft guided />;

	return (
		<div className="flex h-full min-h-0 flex-col bg-background">
			<ScrollArea className="flex-1">
				<div className="space-y-4 p-4">
					{currentStep === "review" && <GuidedReview />}
					{currentStep === "design" && <GuidedDesign />}
					{currentStep === "export" && <ExportSectionBuilder />}
					{currentStep === "save-account" && <SaveAccountStep />}
				</div>
			</ScrollArea>
			<BuilderStepActions />
		</div>
	);
}

function GuidedDesign() {
	return (
		<div className="space-y-4">
			<div className="space-y-1">
				<h2 className="font-display font-semibold text-2xl">
					<Trans>Make it yours</Trans>
				</h2>
				<p className="text-muted-foreground text-sm">
					<Trans>Adjust the look without changing your content.</Trans>
				</p>
			</div>
			<TemplateSectionBuilder />
			<DesignSectionBuilder />
			<TypographySectionBuilder />
			<PageSectionBuilder />
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

function SaveAccountStep() {
	return (
		<div className="space-y-3">
			<h2 className="font-display font-semibold text-2xl">
				<Trans>Save your progress</Trans>
			</h2>
			<p className="text-muted-foreground text-sm">
				<Trans>Create an account when you are ready to keep this resume across devices.</Trans>
			</p>
		</div>
	);
}
