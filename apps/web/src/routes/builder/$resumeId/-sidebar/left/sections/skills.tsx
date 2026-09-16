import type { skillItemSchema } from "@headcv/schema/resume/data";
import type z from "zod";
import { Trans } from "@lingui/react/macro";
import { AnimatePresence, Reorder } from "motion/react";
import { cn } from "@headcv/utils/style";
import { SkillSuggestions } from "@/components/skill-suggestions";
import { useCurrentResume, useUpdateResumeData } from "@/features/resume/builder/draft";
import { SectionBase } from "../shared/section-base";
import { SectionAddItemButton, SectionItem } from "../shared/section-item";

export function SkillsSectionBuilder() {
	const resume = useCurrentResume();
	const section = resume.data.sections.skills;
	const updateResumeData = useUpdateResumeData();
	const locale = "en";

	const handleReorder = (items: z.infer<typeof skillItemSchema>[]) => {
		updateResumeData((draft) => {
			draft.sections.skills.items = items;
		});
	};

	return (
		<SectionBase type="skills" className={cn("rounded-md border", section.items.length === 0 && "border-dashed")}>
			<SkillSuggestions
				jobTitleId={resume.data.metadata?.targetJobTitleId || undefined}
				experienceLevel={resume.data.metadata?.experienceLevel}
				locale={locale}
			/>

			<Reorder.Group axis="y" values={section.items} onReorder={handleReorder}>
				<AnimatePresence initial={false} mode="popLayout">
					{section.items.map((item) => (
						<SectionItem key={item.id} type="skills" item={item} title={item.name} subtitle={item.proficiency} />
					))}
				</AnimatePresence>
			</Reorder.Group>

			<SectionAddItemButton type="skills">
				<Trans>Add a new skill</Trans>
			</SectionAddItemButton>
		</SectionBase>
	);
}
