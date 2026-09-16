import { t } from "@lingui/core/macro";
import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { Button } from "@headcv/ui/components/button";
import { useBuilderStep } from "./use-builder-step";

export function BuilderStepActions() {
	const { goBack, goNext, skipStep, previousStep, nextStep, isCurrentStepComplete, isCurrentStepSkipped } =
		useBuilderStep();

	return (
		<div className="flex items-center justify-between gap-3 border-t bg-background p-4">
			<Button variant="ghost" disabled={!previousStep} onClick={goBack}>
				<ArrowLeftIcon className="size-4" />
				{t`Back`}
			</Button>

			<div className="flex items-center gap-2">
				{!isCurrentStepSkipped && (
					<Button variant="outline" onClick={skipStep}>
						{t`Skip / Not applicable`}
					</Button>
				)}

				<Button disabled={!nextStep || !isCurrentStepComplete} onClick={goNext}>
					{t`Continue`}
					<ArrowRightIcon className="size-4" />
				</Button>
			</div>
		</div>
	);
}
