import type {
	CustomSectionItem,
	CustomSectionType,
	SectionItem as SectionItemType,
	SectionType,
} from "@headcv/schema/resume/data";
import type { ButtonProps } from "@headcv/ui/components/button";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
	ArrowBendUpRightIcon,
	CopySimpleIcon,
	DotsSixVerticalIcon,
	DotsThreeVerticalIcon,
	EyeClosedIcon,
	EyeIcon,
	FileIcon,
	FolderPlusIcon,
	PencilSimpleLineIcon,
	PlusCircleIcon,
	PlusIcon,
	TrashSimpleIcon,
} from "@phosphor-icons/react";
import { Reorder, useDragControls } from "motion/react";
import { useMemo } from "react";
import { Button } from "@headcv/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@headcv/ui/components/dropdown-menu";
import { cn } from "@headcv/utils/style";
import { useDialogStore } from "@/dialogs/store";
import { useCurrentResume, useUpdateResumeData } from "@/features/resume/builder/draft";
import { useConfirm } from "@/hooks/use-confirm";
import {
	addItemToSection,
	createCustomSectionWithItem,
	createPageWithSection,
	getCompatibleMoveTargets,
	getSourceSectionTitle,
	removeItemFromSource,
} from "@/libs/resume/move-item";
import { deleteSectionItem, toggleSectionItemHidden } from "@/libs/resume/section-actions";
import { SectionDropdownMenu } from "./section-menu";
import { useSectionActions } from "./use-section-actions";

// ============================================================================
// MoveItemSubmenu Component
// ============================================================================

type MoveItemSubmenuProps = {
	type: CustomSectionType;
	item: CustomSectionItem | SectionItemType;
	customSectionId?: string;
};

/**
 * Submenu component for moving items between sections/pages.
 * Displays compatible targets grouped by page with options to:
 * - Move to existing compatible section
 * - Create new section on existing page
 * - Create new page with new section
 */
function MoveItemSubmenu({ type, item, customSectionId }: MoveItemSubmenuProps) {
	const resume = useCurrentResume();
	const updateResumeData = useUpdateResumeData();

	/** Compute compatible move targets grouped by page */
	const moveTargets = useMemo(
		() => getCompatibleMoveTargets(resume.data, type, customSectionId),
		[resume, type, customSectionId],
	);

	/** Get the current section's title (used when creating new sections) */
	const currentSectionTitle = useMemo(
		() => getSourceSectionTitle(resume.data, type, customSectionId),
		[resume, type, customSectionId],
	);

	/** Handler: Move item to an existing section */
	const handleMoveToSection = (targetSectionId: string) => {
		updateResumeData((draft) => {
			const removedItem = removeItemFromSource(draft, item.id, type, customSectionId);
			if (!removedItem) return;
			addItemToSection(draft, removedItem, targetSectionId, type);
		});
	};

	/** Handler: Create a new custom section on an existing page and move the item there */
	const handleNewSectionOnPage = (pageIndex: number) => {
		updateResumeData((draft) => {
			const removedItem = removeItemFromSource(draft, item.id, type, customSectionId);
			if (!removedItem) return;
			createCustomSectionWithItem(draft, removedItem, type, currentSectionTitle, pageIndex);
		});
	};

	/** Handler: Create a new page with a new custom section and move the item there */
	const handleNewPage = () => {
		updateResumeData((draft) => {
			const removedItem = removeItemFromSource(draft, item.id, type, customSectionId);
			if (!removedItem) return;
			createPageWithSection(draft, removedItem, type, currentSectionTitle);
		});
	};

	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>
				<ArrowBendUpRightIcon />
				<Trans>Move to</Trans>
			</DropdownMenuSubTrigger>

			<DropdownMenuSubContent>
				{/* Render each page as a submenu */}
				{moveTargets.map(({ pageIndex, sections }) => (
					<DropdownMenuSub key={pageIndex}>
						<DropdownMenuSubTrigger>
							<FileIcon />
							<Trans>Page {pageIndex + 1}</Trans>
						</DropdownMenuSubTrigger>

						<DropdownMenuSubContent>
							{/* Existing compatible sections on this page */}
							{sections.map(({ sectionId, sectionTitle }) => (
								<DropdownMenuItem key={sectionId} onClick={() => handleMoveToSection(sectionId)}>
									{sectionTitle}
								</DropdownMenuItem>
							))}

							{/* Separator if there are existing sections */}
							{sections.length > 0 && <DropdownMenuSeparator />}

							{/* Option to create a new section on this page */}
							<DropdownMenuItem onClick={() => handleNewSectionOnPage(pageIndex)}>
								<FolderPlusIcon />
								<Trans>New Section</Trans>
							</DropdownMenuItem>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				))}

				<DropdownMenuSeparator />

				{/* Option to create a new page with a new section */}
				<DropdownMenuItem onClick={handleNewPage}>
					<PlusCircleIcon />
					<Trans>New Page</Trans>
				</DropdownMenuItem>
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
}

// ============================================================================
// SectionItem Component
// ============================================================================

type Props<T extends CustomSectionItem | SectionItemType> = {
	type: CustomSectionType;
	item: T;
	title: string;
	subtitle?: string;
	customSectionId?: string;
	canMove?: boolean;
};

export function SectionItem<T extends CustomSectionItem | SectionItemType>({
	type,
	item,
	title,
	subtitle,
	customSectionId,
	canMove = true,
}: Props<T>) {
	const confirm = useConfirm();
	const controls = useDragControls();
	const { openInlineDialog } = useDialogStore();
	const updateResumeData = useUpdateResumeData();

	const onToggleVisibility = () => {
		updateResumeData((draft) => toggleSectionItemHidden(draft, type as SectionType, item.id, customSectionId));
	};

	const onUpdate = () => {
		// Type assertion needed because TypeScript can't narrow the union type through template literals
		openInlineDialog(`resume.sections.${type}.update`, { item, customSectionId } as never);
	};

	const onDuplicate = () => {
		// Type assertion needed because TypeScript can't narrow the union type through template literals
		openInlineDialog(`resume.sections.${type}.create`, { item, customSectionId } as never);
	};

	const onDelete = async () => {
		const confirmed = await confirm(t`Are you sure you want to delete this item?`, {
			confirmText: t({
				comment: "Destructive confirmation button label when deleting a section item in resume builder",
				message: "Delete",
			}),
			cancelText: t({
				comment: "Confirmation dialog button label to abort deleting a section item in resume builder",
				message: "Cancel",
			}),
		});

		if (!confirmed) return;

		updateResumeData((draft) => deleteSectionItem(draft, type as SectionType, item.id, customSectionId));
	};

	return (
		<Reorder.Item
			key={item.id}
			value={item}
			dragListener={false}
			dragControls={controls}
			initial={{ opacity: 0, y: -8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -8 }}
			transition={{ duration: 0.16, ease: "easeOut" }}
			className="group relative flex min-h-16 select-none border-b bg-background will-change-[transform,opacity]"
		>
			<div
				className="flex w-10 cursor-ns-resize touch-none items-center justify-center text-muted-foreground/60 transition-colors hover:bg-muted/60 hover:text-foreground"
				onPointerDown={(e) => {
					e.preventDefault();
					controls.start(e);
				}}
			>
				<DotsSixVerticalIcon className="size-5" aria-hidden="true" />
			</div>

			<button
				type="button"
				onClick={onUpdate}
				className={cn(
					"flex min-w-0 flex-1 flex-col items-start justify-center space-y-0.5 px-2 py-3 text-start opacity-100 transition-colors hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
					item.hidden && "opacity-50",
				)}
			>
				<div className="line-clamp-1 font-medium">{title}</div>
				{subtitle && <div className="line-clamp-1 text-muted-foreground text-xs">{subtitle}</div>}
			</button>

			<Button
				variant="ghost"
				size="icon-sm"
				className="my-auto me-1 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
				onClick={onToggleVisibility}
				aria-label={item.hidden ? t`Show entry` : t`Hide entry`}
			>
				{item.hidden ? <EyeIcon aria-hidden="true" /> : <EyeClosedIcon aria-hidden="true" />}
			</Button>

			<DropdownMenu>
				<DropdownMenuTrigger
					className="my-auto me-2 flex size-8 cursor-context-menu items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
					aria-label={t`More entry actions`}
				>
					<DotsThreeVerticalIcon aria-hidden="true" />
				</DropdownMenuTrigger>

				<DropdownMenuContent align="end">
					<DropdownMenuGroup>
						<DropdownMenuItem onClick={onUpdate}>
							<PencilSimpleLineIcon />
							<Trans>Update</Trans>
						</DropdownMenuItem>

						<DropdownMenuItem onClick={onDuplicate}>
							<CopySimpleIcon />
							<Trans>Duplicate</Trans>
						</DropdownMenuItem>

						{canMove && <MoveItemSubmenu type={type} item={item} customSectionId={customSectionId} />}
					</DropdownMenuGroup>

					<DropdownMenuSeparator />

					<DropdownMenuGroup>
						<DropdownMenuItem variant="destructive" onClick={onDelete}>
							<TrashSimpleIcon />
							<Trans>Delete</Trans>
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</Reorder.Item>
	);
}

type AddButtonProps = Omit<ButtonProps, "type"> & {
	type: CustomSectionType | "custom";
	customSectionId?: string;
	onAdd?: () => void;
};

export function SectionAddItemButton({
	type,
	customSectionId,
	onAdd,
	className,
	children,
	variant = "outline",
	size = "sm",
	...props
}: AddButtonProps) {
	const { openInlineDialog } = useDialogStore();
	const actions = useSectionActions(type === "custom" ? "custom" : (type as SectionType));

	const handleAdd = () => {
		if (onAdd) {
			onAdd();
			return;
		}
		if (type === "custom") {
			openInlineDialog("resume.sections.custom.create", undefined);
		} else {
			openInlineDialog(`resume.sections.${type}.create`, customSectionId ? { customSectionId } : undefined);
		}
	};

	return (
		<div className="grid min-h-14 grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center border-t px-3 py-2">
			<div className="justify-self-start">
				{type !== "custom" && (actions.canHide || actions.canSetColumns || actions.canReset) && (
					<SectionDropdownMenu type={type as "summary" | SectionType} />
				)}
			</div>
			<div className="justify-self-center">
				<Button
					variant={variant}
					size={size}
					onClick={handleAdd}
					className={cn("min-w-30 bg-background px-4 shadow-none", className)}
					{...props}
				>
					<PlusIcon aria-hidden="true" />
					{type === "custom" ? children : <Trans>Add Entry</Trans>}
				</Button>
			</div>
			{type !== "custom" ? (
				<Button
					variant="ghost"
					size="icon"
					className="justify-self-end text-destructive hover:bg-destructive/10 hover:text-destructive"
					onClick={() => void actions.onReset()}
					aria-label={t`Delete all entries`}
				>
					<TrashSimpleIcon aria-hidden="true" />
				</Button>
			) : (
				<div />
			)}
		</div>
	);
}
