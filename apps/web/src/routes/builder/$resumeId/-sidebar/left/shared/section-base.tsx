import type { LeftSidebarSection } from "@/libs/resume/section";
import type { BuilderSearch } from "@/routes/builder/$resumeId/-components/workspace-search";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { PencilSimpleLineIcon } from "@phosphor-icons/react";
import { useNavigate } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@headcv/ui/components/accordion";
import { Button } from "@headcv/ui/components/button";
import { cn } from "@headcv/utils/style";
import { useAiAssistant } from "@/features/resume/builder/ai-assistant";
import { aiChangedSectionClassName } from "@/features/resume/builder/ai-changes";
import { useCurrentResume } from "@/features/resume/builder/draft";
import { getResumePreviewSectionId, requestResumePreviewSection } from "@/features/resume/preview/preview-navigation";
import { getSectionIcon, getSectionTitle } from "@/libs/resume/section";
import { useBuilderSectionNavigation } from "../../../-components/section-navigation-context";
import { useSectionStore } from "../../../-store/section";
import { useSectionActions } from "./use-section-actions";

type Props = React.ComponentProps<typeof AccordionContent> & {
	type: LeftSidebarSection;
	/** Optional status shown beside the title, visible while collapsed. */
	badge?: React.ReactNode;
};

export function SectionBase({ type, badge, className, children, ...props }: Props) {
	const resume = useCurrentResume();
	const navigate = useNavigate({ from: "/builder/$resumeId" });
	const { changedSections, selectReviewSection } = useAiAssistant();
	const data = resume.data;
	const isAiChanged = changedSections.includes(type);
	const section =
		type === "basics"
			? data.basics
			: type === "summary"
				? data.summary
				: type === "picture"
					? data.picture
					: type === "custom"
						? data.customSections
						: type === "ai-review"
							? undefined
							: data.sections[type];

	const isHidden = Boolean(section && "hidden" in section && section.hidden);
	// The AI review card starts collapsed so its summary sits above the sections without pushing them down.
	const collapsed = useSectionStore((state) => state.sections[type]?.collapsed ?? type === "ai-review");
	const expandLeftSection = useSectionStore((state) => state.expandLeftSection);
	const setCollapsed = useSectionStore((state) => state.setCollapsed);
	const { navigateToSection } = useBuilderSectionNavigation();
	const sectionTitle = (section && "title" in section && section.title) || getSectionTitle(type);

	const { canAddItem, canRename, onRenameSection } = useSectionActions(type);

	const handleValueChange = (value: string[]) => {
		const willExpand = value.includes(type);
		if (willExpand) {
			expandLeftSection(type);
			if (type !== "custom" && type !== "ai-review") {
				requestResumePreviewSection(getResumePreviewSectionId(type));
			}
			if (navigateToSection) {
				navigateToSection(type);
			}
		} else {
			setCollapsed(type, true);
		}
	};

	return (
		<div
			id={`sidebar-${type}`}
			className={cn(
				"rounded-2xl border bg-background shadow-sm",
				isHidden && "opacity-50",
				aiChangedSectionClassName(isAiChanged),
				isAiChanged && "rounded-r-md p-2",
			)}
		>
			<Accordion value={collapsed ? [] : [type]} onValueChange={handleValueChange} className="w-full">
				<AccordionItem value={type} className="border-0">
					<div className="relative px-4 py-3">
						<AccordionTrigger
							className={cn("flex w-full items-center gap-x-3 text-start hover:no-underline", "pe-10")}
							aria-label={t`Show ${sectionTitle} in preview`}
						>
							<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
								{getSectionIcon(type, { className: "size-4.5" })}
							</span>
							<div className="flex flex-1 items-center gap-x-3">
								<h2 className="line-clamp-1 font-semibold text-base tracking-tight">{sectionTitle}</h2>
								{badge}
							</div>
						</AccordionTrigger>

						<div className="absolute end-10 top-1/2 flex -translate-y-1/2 items-center gap-x-1">
							{isAiChanged ? (
								<Button
									size="xs"
									variant="secondary"
									className="hidden h-auto gap-0 border-green-200 bg-green-100 text-[0.65rem] text-green-800 hover:bg-green-200 sm:inline-flex dark:border-green-800 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
									onClick={(event) => {
										event.stopPropagation();
										selectReviewSection(type);
										void navigate({
											search: (previous: BuilderSearch) => ({
												...previous,
												tab: "content",
												section: "ai-review",
												reviewSection: type,
											}),
										});
									}}
								>
									<Trans>AI updated</Trans>
								</Button>
							) : null}

							{canRename && !collapsed && (
								<Button
									variant="outline"
									size="sm"
									className="bg-background shadow-none"
									onClick={(event) => {
										event.stopPropagation();
										if (type !== "custom" && type !== "ai-review") {
											requestResumePreviewSection(getResumePreviewSectionId(type));
										}
										void onRenameSection();
									}}
									aria-label={t`Edit ${sectionTitle} heading`}
								>
									<PencilSimpleLineIcon className="size-4" aria-hidden="true" />
									<span className="hidden ps-1 sm:inline">
										<Trans>Edit Heading</Trans>
									</span>
								</Button>
							)}
						</div>
					</div>

					<AccordionContent
						className={cn(
							"border-t data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
							!canAddItem && "px-4 py-4",
							className,
						)}
						{...props}
					>
						{children}
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
}
