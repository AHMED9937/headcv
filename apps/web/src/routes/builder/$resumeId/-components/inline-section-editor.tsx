import type { CustomSectionType, SectionType } from "@headcv/schema/resume/data";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon, LightbulbIcon, TrashSimpleIcon } from "@phosphor-icons/react";
import { useBlocker } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@headcv/ui/components/button";
import { InlineDialogProvider } from "@headcv/ui/components/dialog";
import { SectionTips } from "@/components/section-tips";
import { renderDialog } from "@/dialogs/renderers";
import { useDialogStore } from "@/dialogs/store";
import { useCurrentResume, useUpdateResumeData, useUpdateResumeDataLocal } from "@/features/resume/builder/draft";
import { requestResumePreviewSection } from "@/features/resume/preview/preview-navigation";
import { useConfirm } from "@/hooks/use-confirm";
import { InlineResumeFormContext } from "@/libs/inline-resume-form-context";
import {
	deleteCustomSection,
	deleteSectionItem,
	toggleCustomSectionHidden,
	toggleSectionItemHidden,
} from "@/libs/resume/section-actions";

export function InlineSectionEditor() {
	const { activeDialog, closeDialog, onOpenChange, presentation } = useDialogStore();
	const confirm = useConfirm();
	const resume = useCurrentResume();
	const updateResumeData = useUpdateResumeData();
	const updateResumeDataLocal = useUpdateResumeDataLocal();
	const editorRef = useRef<HTMLDivElement>(null);
	const [showTips, setShowTips] = useState(false);

	const match = activeDialog ? /^resume\.sections\.([^.]+)\.(create|update)$/.exec(activeDialog.type) : null;
	const sectionType = match?.[1] as SectionType | "custom" | undefined;
	const isCreate = match?.[2] === "create";
	const dialogData = (activeDialog?.data ?? {}) as {
		id?: string;
		hidden?: boolean;
		item?: { id: string; hidden?: boolean };
		type?: CustomSectionType;
		customSectionId?: string;
	};
	const activeEditorKey = [activeDialog?.type, dialogData.id, dialogData.item?.id, dialogData.customSectionId].join(
		":",
	);

	useEffect(() => {
		void activeEditorKey;
		setShowTips(false);
	}, [activeEditorKey]);

	useEffect(() => {
		if (presentation !== "inline" || !sectionType) return;
		const targetSectionId = dialogData.customSectionId ?? (sectionType === "custom" ? dialogData.id : sectionType);
		if (targetSectionId) requestResumePreviewSection(targetSectionId);
	}, [dialogData.customSectionId, dialogData.id, presentation, sectionType]);

	const inlineFormContextValue = useMemo(
		() =>
			sectionType
				? {
						sectionType,
						isCreate,
						customSectionId: dialogData.customSectionId,
						updateResumeDataLocal,
					}
				: null,
		[sectionType, isCreate, dialogData.customSectionId, updateResumeDataLocal],
	);

	// Leaving the builder mid-edit asks the same save/discard question as the Back button.
	useBlocker({
		shouldBlockFn: async () => {
			const guard = useDialogStore.getState().onBeforeClose;
			return guard ? !(await guard()) : false;
		},
		disabled: presentation !== "inline" || !activeDialog,
		enableBeforeUnload: false,
	});

	if (presentation !== "inline" || !activeDialog) return null;

	const isCustomSectionEditor = sectionType === "custom";
	const entityId = isCreate ? undefined : isCustomSectionEditor ? dialogData.id : dialogData.item?.id;
	const liveCustomSection = isCustomSectionEditor
		? resume.data.customSections.find((section) => section.id === entityId)
		: undefined;
	const liveSection =
		!isCustomSectionEditor && dialogData.customSectionId
			? resume.data.customSections.find((section) => section.id === dialogData.customSectionId)
			: !isCustomSectionEditor && sectionType
				? resume.data.sections[sectionType]
				: undefined;
	const liveItem =
		liveSection && "items" in liveSection ? liveSection.items.find((item) => item.id === entityId) : undefined;
	const isHidden =
		liveCustomSection?.hidden ?? liveItem?.hidden ?? dialogData.hidden ?? dialogData.item?.hidden ?? false;
	const supportsTips = !isCustomSectionEditor;

	const onHide = () => {
		if (!sectionType || !entityId) return;
		updateResumeData((draft) => {
			if (sectionType === "custom") {
				toggleCustomSectionHidden(draft, entityId);
				return;
			}
			toggleSectionItemHidden(draft, sectionType, entityId, dialogData.customSectionId);
		});
	};

	const onDelete = async () => {
		if (!sectionType || !entityId) return;
		const confirmed = await confirm(
			sectionType === "custom"
				? t`Are you sure you want to delete this custom section?`
				: t`Are you sure you want to delete this item?`,
			{
				confirmText: t`Delete`,
				cancelText: t`Cancel`,
			},
		);
		if (!confirmed) return;
		updateResumeData((draft) => {
			if (sectionType === "custom") {
				deleteCustomSection(draft, entityId);
				return;
			}
			deleteSectionItem(draft, sectionType, entityId, dialogData.customSectionId);
		});
		closeDialog();
	};

	const onDone = () => {
		editorRef.current?.querySelector<HTMLFormElement>("form")?.requestSubmit();
	};

	const content = renderDialog(activeDialog);

	return (
		<div ref={editorRef} className="space-y-3 [&_[data-slot=dialog-footer]]:hidden">
			<div className="flex items-center justify-between gap-2">
				{/* Routes through the form's unsaved-changes guard instead of closing directly. */}
				<Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
					<ArrowLeftIcon aria-hidden="true" />
					<Trans>Back to entries</Trans>
				</Button>
				<div className="flex items-center gap-1">
					{supportsTips && (
						<Button
							variant="ghost"
							size="sm"
							aria-expanded={showTips}
							onClick={() => setShowTips((current) => !current)}
						>
							<LightbulbIcon aria-hidden="true" />
							<Trans>Get Tips</Trans>
						</Button>
					)}
					{!isCreate && (
						<>
							<Button variant="ghost" size="icon-sm" title={isHidden ? t`Show` : t`Hide`} onClick={onHide}>
								{isHidden ? <EyeIcon aria-hidden="true" /> : <EyeSlashIcon aria-hidden="true" />}
								<span className="sr-only">{isHidden ? <Trans>Show</Trans> : <Trans>Hide</Trans>}</span>
							</Button>
							<Button
								variant="ghost"
								size="icon-sm"
								title={t`Delete`}
								className="text-destructive hover:text-destructive"
								onClick={onDelete}
							>
								<TrashSimpleIcon aria-hidden="true" />
								<span className="sr-only">
									<Trans>Delete</Trans>
								</span>
							</Button>
						</>
					)}
				</div>
			</div>
			{supportsTips && showTips && sectionType && (
				<div className="rounded-xl border bg-muted/40 p-3" data-inline-tips>
					<SectionTips type={sectionType} />
				</div>
			)}
			<InlineResumeFormContext.Provider value={inlineFormContextValue}>
				<InlineDialogProvider>{content}</InlineDialogProvider>
			</InlineResumeFormContext.Provider>
			<Button className="w-full" onClick={onDone}>
				<Trans>Done</Trans>
			</Button>
		</div>
	);
}
