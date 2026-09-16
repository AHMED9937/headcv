import type { SectionType } from "@headcv/schema/resume/data";
import type { LeftSidebarSection } from "@/libs/resume/section";
import type { BuilderSearch } from "@/routes/builder/$resumeId/-components/workspace-search";
import { Trans } from "@lingui/react/macro";
import { CaretDownIcon } from "@phosphor-icons/react";
import { useNavigate } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@headcv/ui/components/accordion";
import { Button } from "@headcv/ui/components/button";
import { cn } from "@headcv/utils/style";
import { useAiAssistant } from "@/features/resume/builder/ai-assistant";
import { aiChangedSectionClassName } from "@/features/resume/builder/ai-changes";
import { useCurrentResume } from "@/features/resume/builder/draft";
import { getSectionIcon, getSectionTitle } from "@/libs/resume/section";
import { useSectionStore } from "../../../-store/section";
import { SectionDropdownMenu } from "./section-menu";

type Props = React.ComponentProps<typeof AccordionContent> & {
	type: LeftSidebarSection;
};

export function SectionBase({ type, className, ...props }: Props) {
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
	const collapsed = useSectionStore((state) => state.sections[type]?.collapsed ?? false);
	const toggleCollapsed = useSectionStore((state) => state.toggleCollapsed);

	return (
		<Accordion
			id={`sidebar-${type}`}
			value={collapsed ? [] : [type]}
			onValueChange={() => toggleCollapsed(type)}
			className={cn(
				"space-y-4",
				isHidden && "opacity-50",
				aiChangedSectionClassName(isAiChanged),
				isAiChanged && "rounded-r-md p-2",
			)}
		>
			<AccordionItem value={type} className="group/accordion-item space-y-4">
				<div className="flex items-center">
					<AccordionTrigger
						className="me-2 items-center justify-center"
						render={
							<Button size="icon" variant="ghost">
								<CaretDownIcon className="transition-transform duration-200 group-data-closed/accordion-item:-rotate-90" />
							</Button>
						}
					/>

					<div className="flex flex-1 items-center gap-x-4">
						{getSectionIcon(type)}
						<h2 className="line-clamp-1 font-semibold text-2xl tracking-tight">
							{(section && "title" in section && section.title) || getSectionTitle(type)}
						</h2>
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
					</div>

					{!["picture", "basics", "custom"].includes(type) && (
						<SectionDropdownMenu type={type as "summary" | SectionType} />
					)}
				</div>

				<AccordionContent
					className={cn(
						"p-0 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
						className,
					)}
					{...props}
				/>
			</AccordionItem>
		</Accordion>
	);
}
