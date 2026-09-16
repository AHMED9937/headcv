import { Trans } from "@lingui/react/macro";
import { CaretRightIcon, SparkleIcon } from "@phosphor-icons/react";
import { Button } from "@headcv/ui/components/button";
import { useAiAssistant } from "./ai-assistant";

export function AiAssistantBanner() {
	const { hasReviewableChanges, focusChanges } = useAiAssistant();

	if (!hasReviewableChanges) return null;

	return (
		<div className="border-green-200 border-b bg-green-50/80 px-4 py-2.5 dark:border-green-800 dark:bg-green-950/20">
			<div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
						<SparkleIcon className="size-4 text-green-600 dark:text-green-400" weight="fill" />
					</div>
					<div className="min-w-0">
						<p className="font-medium text-green-950 text-sm dark:text-green-100">
							<Trans>AI changes need review</Trans>
						</p>
						<p className="text-green-800/80 text-xs dark:text-green-200/80">
							<Trans>Keep or revert these changes before requesting another AI update.</Trans>
						</p>
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<Button
						size="sm"
						className="h-8 bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:text-green-950 dark:hover:bg-green-400"
						onClick={focusChanges}
					>
						<Trans>Review</Trans>
						<CaretRightIcon className="ms-1 size-3.5" />
					</Button>
				</div>
			</div>
		</div>
	);
}
