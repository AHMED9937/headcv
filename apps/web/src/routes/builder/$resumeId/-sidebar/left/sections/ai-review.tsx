import { Plural } from "@lingui/react/macro";
import { useAiAssistant } from "@/features/resume/builder/ai-assistant";
import { AiReviewWorkspace } from "@/features/resume/builder/ai-review";
import { SectionBase } from "../shared/section-base";

/** AI-suggested changes as a regular section card; expanding it opens the full review. */
export function AiReviewSectionBuilder() {
	const { visibleChangedPreviewSectionIds, changedPreviewSectionIds } = useAiAssistant();
	const changeCount = (
		visibleChangedPreviewSectionIds.length > 0 ? visibleChangedPreviewSectionIds : changedPreviewSectionIds
	).length;

	return (
		<SectionBase
			type="ai-review"
			badge={
				changeCount > 0 ? (
					<span className="rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-800 text-xs dark:bg-green-900 dark:text-green-200">
						<Plural value={changeCount} one="# section to review" other="# sections to review" />
					</span>
				) : null
			}
		>
			<AiReviewWorkspace />
		</SectionBase>
	);
}
