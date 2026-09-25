import type { CustomSectionType, SectionType } from "@headcv/schema/resume/data";
import type { LeftSidebarSection } from "@/libs/resume/section";
import { t } from "@lingui/core/macro";
import { useMemo } from "react";
import { useDialogStore } from "@/dialogs/store";
import { useCurrentResume, useUpdateResumeData } from "@/features/resume/builder/draft";
import { useConfirm } from "@/hooks/use-confirm";
import { usePrompt } from "@/hooks/use-prompt";

type SectionActionSection = {
	title?: string;
	hidden?: boolean;
	columns?: number;
	items?: { length: number };
};

export function useSectionActions(type: LeftSidebarSection) {
	const prompt = usePrompt();
	const confirm = useConfirm();
	const { openInlineDialog } = useDialogStore();
	const updateResumeData = useUpdateResumeData();
	const resume = useCurrentResume();

	const section = useMemo<SectionActionSection | undefined>(() => {
		switch (type) {
			case "summary":
				return resume.data.summary;
			case "picture":
				return resume.data.picture;
			case "basics":
			case "custom":
			case "ai-review":
				return undefined;
			default:
				return resume.data.sections[type as SectionType];
		}
	}, [type, resume.data]);

	const canRename = Boolean(section && "title" in section && type !== "picture" && type !== "custom");
	const canAddItem = type !== "picture" && type !== "basics" && type !== "custom" && type !== "ai-review";
	const canHide = Boolean(section && "hidden" in section);
	const canSetColumns = Boolean(section && "columns" in section && type !== "picture");
	const canReset = canRename;

	const isHidden = Boolean(section?.hidden);
	const columns = section?.columns;

	const onRenameSection = async () => {
		if (!section || !("title" in section)) return;

		const newTitle = await prompt(t`What do you want to rename this section to?`, {
			description: t`Leave empty to reset the title to the original.`,
			defaultValue: section.title,
		});

		if (newTitle === null || newTitle === section.title) return;

		updateResumeData((draft) => {
			if (type === "summary") {
				draft.summary.title = newTitle ?? "";
			} else if (type !== "custom" && type !== "ai-review" && type !== "picture" && type !== "basics") {
				draft.sections[type as SectionType].title = newTitle ?? "";
			}
		});
	};

	const onToggleVisibility = () => {
		if (!section || !("hidden" in section)) return;

		updateResumeData((draft) => {
			if (type === "summary") {
				draft.summary.hidden = !draft.summary.hidden;
			} else if (type === "picture") {
				draft.picture.hidden = !draft.picture.hidden;
			} else if (type !== "custom" && type !== "ai-review" && type !== "basics") {
				draft.sections[type as SectionType].hidden = !draft.sections[type as SectionType].hidden;
			}
		});
	};

	const onAddItem = () => {
		if (!canAddItem) return;
		openInlineDialog(`resume.sections.${type as SectionType | CustomSectionType}.create`, undefined);
	};

	const onSetColumns = (value: string) => {
		if (!section || !("columns" in section)) return;

		updateResumeData((draft) => {
			if (type === "summary") {
				draft.summary.columns = Number.parseInt(value, 10);
			} else if (type !== "custom" && type !== "ai-review" && type !== "picture" && type !== "basics") {
				draft.sections[type as SectionType].columns = Number.parseInt(value, 10);
			}
		});
	};

	const onReset = async () => {
		if (!canReset) return;

		const confirmed = await confirm(t`Are you sure you want to reset this section?`, {
			description: t`This will remove all items from this section.`,
			confirmText: t({
				comment: "Destructive confirmation button label when resetting a resume section",
				message: "Reset",
			}),
			cancelText: t({
				comment: "Confirmation dialog button label to abort resetting a resume section",
				message: "Cancel",
			}),
		});

		if (!confirmed) return;

		updateResumeData((draft) => {
			if (type === "summary") {
				draft.summary.content = "";
			} else if (type !== "custom" && type !== "ai-review" && type !== "picture" && type !== "basics") {
				draft.sections[type as SectionType].items = [];
			}
		});
	};

	return {
		canRename,
		canAddItem,
		canHide,
		canSetColumns,
		canReset,
		isHidden,
		columns,
		onRenameSection,
		onToggleVisibility,
		onAddItem,
		onSetColumns,
		onReset,
	};
}
