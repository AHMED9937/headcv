import { Trans } from "@lingui/react/macro";
import { AnimatePresence, Reorder } from "motion/react";
import { useDialogStore } from "@/dialogs/store";
import { useCurrentResume } from "@/features/resume/builder/draft";
import { SectionBase } from "../shared/section-base";
import { SectionAddItemButton, SectionItem } from "../shared/section-item";

const SUMMARY_ITEM_ID = "built-in-summary";

function getSummaryLabel(content: string) {
	const plainText = content
		.replace(/<[^>]*>/g, " ")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/\s+/g, " ")
		.trim();

	return plainText || "Summary";
}

export function SummarySectionBuilder() {
	const resume = useCurrentResume();
	const { openInlineDialog } = useDialogStore();
	const section = resume.data.summary;
	const item = {
		id: SUMMARY_ITEM_ID,
		hidden: section.hidden,
		content: section.content,
	};
	const items = section.content.trim() ? [item] : [];
	const openSummaryEditor = () => {
		if (items.length > 0) {
			openInlineDialog("resume.sections.summary.update", { item });
			return;
		}
		openInlineDialog("resume.sections.summary.create", undefined);
	};

	return (
		<SectionBase type="summary">
			<Reorder.Group axis="y" values={items} onReorder={() => undefined}>
				<AnimatePresence initial={false} mode="popLayout">
					{items.map((summaryItem) => (
						<SectionItem
							key={summaryItem.id}
							type="summary"
							item={summaryItem}
							title={getSummaryLabel(summaryItem.content)}
							canMove={false}
						/>
					))}
				</AnimatePresence>
			</Reorder.Group>

			<SectionAddItemButton type="summary" onAdd={openSummaryEditor}>
				<Trans>Add a summary</Trans>
			</SectionAddItemButton>
		</SectionBase>
	);
}
