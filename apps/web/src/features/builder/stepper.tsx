import type { BuilderStepId } from "./steps";
import { t } from "@lingui/core/macro";
import { CheckIcon, DotsThreeIcon } from "@phosphor-icons/react";
import { Button } from "@headcv/ui/components/button";
import { cn } from "@headcv/utils/style";
import { useCurrentResume } from "@/features/resume/builder/draft";
import { useIsMobile } from "@/hooks/use-mobile";
import { BUILDER_STEPS, getStepLabel, isStepComplete, isStepSkipped } from "./steps";

export type StepperProps = {
	currentStep: BuilderStepId;
	onStepClick: (stepId: BuilderStepId) => void;
	mode?: "create" | "import" | "normal";
};

export function BuilderStepper({ currentStep, onStepClick, mode = "normal" }: StepperProps) {
	const resume = useCurrentResume();
	const isMobile = useIsMobile();
	const steps =
		mode === "normal" ? BUILDER_STEPS : BUILDER_STEPS.filter((step) => step.id !== "setup" && step.id !== "template");
	const currentIndex = steps.findIndex((step) => step.id === currentStep);

	if (isMobile) {
		return (
			<div className="flex items-center justify-between border-b bg-background px-4 py-2.5">
				<div className="flex items-center gap-1.5">
					<span className="font-medium text-foreground text-sm">
						{currentIndex >= 0 && getStepLabel(steps[currentIndex]?.id)}
					</span>
					<span className="text-muted-foreground text-xs">
						{currentIndex + 1}/{steps.length}
					</span>
				</div>

				<div className="flex items-center gap-1">
					{currentIndex > 0 && (
						<Button variant="ghost" size="xs" onClick={() => onStepClick(steps[currentIndex - 1]?.id)}>
							{t`Back`}
						</Button>
					)}
					{currentIndex < steps.length - 1 && (
						<Button variant="ghost" size="xs" onClick={() => onStepClick(steps[currentIndex + 1]?.id)}>
							{t`Next`}
						</Button>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="bg-background px-2">
			<nav aria-label={t`Builder steps`}>
				<ol className="flex items-stretch gap-0 overflow-x-auto">
					{steps.map((step) => {
						const isCurrent = step.id === currentStep;
						const isCompleted = isStepComplete(step.id, resume);
						const isSkipped = isStepSkipped(step.id, resume);

						return (
							<li key={step.id} className="flex min-w-0">
								<button
									type="button"
									onClick={() => onStepClick(step.id)}
									className={cn(
										"relative flex min-w-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
										isCurrent
											? "border-primary text-foreground"
											: "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
									)}
									aria-current={isCurrent ? "step" : undefined}
								>
									{isCompleted && !isSkipped && (
										<CheckIcon className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
									)}
									{isSkipped && (
										<DotsThreeIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
									)}

									<span
										className={cn(
											"truncate text-sm",
											isCurrent ? "font-semibold" : "font-medium",
											isCompleted && !isSkipped && !isCurrent && "text-foreground",
										)}
									>
										{getStepLabel(step.id)}
									</span>

									{step.required && <span className="sr-only">{t`required`}</span>}
								</button>
							</li>
						);
					})}
				</ol>
			</nav>
		</div>
	);
}
