import type { Resume } from "@/features/resume/builder/draft";
import type { LeftSidebarSection } from "@/libs/resume/section";
import { t } from "@lingui/core/macro";
import { match } from "ts-pattern";

export type BuilderStepId =
	| "setup"
	| "template"
	| "personal-details"
	| "profiles"
	| "work-experience"
	| "education"
	| "skills"
	| "summary"
	| "additional-sections"
	| "review"
	| "design"
	| "export"
	| "save-account";

export type BuilderStep = {
	id: BuilderStepId;
	required: boolean;
};

export const BUILDER_STEPS: BuilderStep[] = [
	{ id: "setup", required: true },
	{ id: "template", required: true },
	{ id: "personal-details", required: true },
	{ id: "profiles", required: false },
	{ id: "work-experience", required: true },
	{ id: "education", required: false },
	{ id: "skills", required: false },
	{ id: "summary", required: false },
	{ id: "additional-sections", required: false },
	{ id: "review", required: false },
	{ id: "design", required: false },
	{ id: "export", required: false },
	{ id: "save-account", required: false },
];

export function getStepLabel(stepId: BuilderStepId): string {
	return match(stepId)
		.with("setup", () => t`Setup`)
		.with("template", () => t`Template`)
		.with("personal-details", () => t`Personal Details`)
		.with("profiles", () => t`Profiles`)
		.with("work-experience", () => t`Work Experience`)
		.with("education", () => t`Education`)
		.with("skills", () => t`Skills`)
		.with("summary", () => t`Summary`)
		.with("additional-sections", () => t`Additional Sections`)
		.with("review", () => t`Review`)
		.with("design", () => t`Design`)
		.with("export", () => t`Export`)
		.with("save-account", () => t`Save Account`)
		.exhaustive();
}

export function isStepComplete(stepId: BuilderStepId, resume: Resume): boolean {
	switch (stepId) {
		case "setup":
			return !!resume.data.metadata?.targetJobTitleId;
		case "template":
			return !!resume.data.metadata?.template;
		case "personal-details":
			return !!resume.data.basics?.name?.trim() && !!resume.data.basics?.headline?.trim();
		case "profiles":
			return resume.data.sections?.profiles?.items?.length > 0;
		case "work-experience":
			return resume.data.sections?.experience?.items?.length > 0;
		case "education":
			return resume.data.sections?.education?.items?.length > 0;
		case "skills":
			return resume.data.sections?.skills?.items?.length > 0;
		case "summary":
			return resume.data.summary?.content?.trim().length > 0;
		case "additional-sections":
		case "review":
		case "design":
		case "export":
		case "save-account":
			return (resume.data.metadata?.completedSteps as BuilderStepId[] | undefined)?.includes(stepId) ?? false;
		default:
			return false;
	}
}

export function getSkippedSteps(resume: Resume): BuilderStepId[] {
	return (resume.data.metadata?.skippedSteps as BuilderStepId[]) ?? [];
}

export function isStepSkipped(stepId: BuilderStepId, resume: Resume): boolean {
	return getSkippedSteps(resume).includes(stepId);
}

export function getLastIncompleteStep(resume: Resume): BuilderStepId {
	for (const step of BUILDER_STEPS) {
		if (!isStepComplete(step.id, resume) && !isStepSkipped(step.id, resume)) {
			return step.id;
		}
	}

	return BUILDER_STEPS[BUILDER_STEPS.length - 1]?.id;
}

export function getFirstStep(): BuilderStepId {
	return BUILDER_STEPS[0]?.id;
}

export function getNextStep(stepId: BuilderStepId): BuilderStepId | undefined {
	const index = BUILDER_STEPS.findIndex((step) => step.id === stepId);
	if (index === -1 || index === BUILDER_STEPS.length - 1) return undefined;
	return BUILDER_STEPS[index + 1]?.id;
}

export function getPreviousStep(stepId: BuilderStepId): BuilderStepId | undefined {
	const index = BUILDER_STEPS.findIndex((step) => step.id === stepId);
	if (index <= 0) return undefined;
	return BUILDER_STEPS[index - 1]?.id;
}

export function isValidStepId(value: string | undefined): value is BuilderStepId {
	if (!value) return false;
	return BUILDER_STEPS.some((step) => step.id === value);
}

export function getStepSectionId(stepId: BuilderStepId): LeftSidebarSection | null {
	switch (stepId) {
		case "personal-details":
			return "basics";
		case "profiles":
			return "profiles";
		case "work-experience":
			return "experience";
		case "education":
			return "education";
		case "skills":
			return "skills";
		case "summary":
			return "summary";
		case "additional-sections":
			return "custom";
		default:
			return null;
	}
}
