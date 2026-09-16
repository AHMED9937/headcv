export { getStepSectionId } from "./steps";

import type { BuilderStepId } from "./steps";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { useCurrentResume, useUpdateResumeData } from "@/features/resume/builder/draft";
import {
	BUILDER_STEPS,
	getLastIncompleteStep,
	getNextStep,
	getPreviousStep,
	isStepComplete,
	isStepSkipped,
	isValidStepId,
} from "./steps";

export type BuilderStepSearch = {
	step?: string;
};

export function useBuilderStep() {
	const resume = useCurrentResume();
	const updateResumeData = useUpdateResumeData();
	const navigate = useNavigate({ from: "/builder/$resumeId" });
	const search = useSearch({ from: "/builder/$resumeId" }) as BuilderStepSearch;

	const currentStep: BuilderStepId = useMemo(() => {
		if (isValidStepId(search.step)) return search.step;
		return getLastIncompleteStep(resume);
	}, [search.step, resume]);

	const setStep = useCallback(
		(stepId: BuilderStepId) => {
			void navigate({ search: (prev: BuilderStepSearch) => ({ ...prev, step: stepId }) });
		},
		[navigate],
	);

	const currentStepIndex = useMemo(() => BUILDER_STEPS.findIndex((step) => step.id === currentStep), [currentStep]);

	const nextStep = useMemo(() => getNextStep(currentStep), [currentStep]);
	const previousStep = useMemo(() => getPreviousStep(currentStep), [currentStep]);

	const goNext = useCallback(() => {
		if (!nextStep) return;
		updateResumeData((draft) => {
			const completedSteps = new Set(draft.metadata.completedSteps ?? []);
			completedSteps.add(currentStep);
			draft.metadata.completedSteps = [...completedSteps];
		});
		setStep(nextStep);
	}, [currentStep, nextStep, setStep, updateResumeData]);

	const goBack = useCallback(() => {
		if (!previousStep) return;
		setStep(previousStep);
	}, [previousStep, setStep]);

	const skipStep = useCallback(() => {
		if (!nextStep) return;
		updateResumeData((draft) => {
			const skippedSteps = new Set(draft.metadata.skippedSteps ?? []);
			skippedSteps.add(currentStep);
			draft.metadata.skippedSteps = [...skippedSteps];
			const completedSteps = new Set(draft.metadata.completedSteps ?? []);
			completedSteps.delete(currentStep);
			draft.metadata.completedSteps = [...completedSteps];
		});
		setStep(nextStep);
	}, [currentStep, nextStep, setStep, updateResumeData]);

	const unskipStep = useCallback(
		(stepId: BuilderStepId) => {
			updateResumeData((draft) => {
				const skippedSteps = new Set(draft.metadata.skippedSteps ?? []);
				skippedSteps.delete(stepId);
				draft.metadata.skippedSteps = [...skippedSteps];
				const completedSteps = new Set(draft.metadata.completedSteps ?? []);
				completedSteps.delete(stepId);
				draft.metadata.completedSteps = [...completedSteps];
			});
			setStep(stepId);
		},
		[setStep, updateResumeData],
	);

	const isCurrentStepComplete = isStepComplete(currentStep, resume);
	const isCurrentStepSkipped = isStepSkipped(currentStep, resume);

	return {
		resume,
		currentStep,
		currentStepIndex,
		nextStep,
		previousStep,
		setStep,
		goNext,
		goBack,
		skipStep,
		unskipStep,
		isCurrentStepComplete,
		isCurrentStepSkipped,
	};
}
