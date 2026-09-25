import type { projectItemSchema } from "@headcv/schema/resume/data";
import type z from "zod";
import { Trans } from "@lingui/react/macro";
import { AnimatePresence, Reorder } from "motion/react";
import { formatDateRange } from "@headcv/utils/date";
import { useCurrentResume, useUpdateResumeData } from "@/features/resume/builder/draft";
import { SectionBase } from "../shared/section-base";
import { SectionAddItemButton, SectionItem } from "../shared/section-item";

export function ProjectsSectionBuilder() {
	const resume = useCurrentResume();
	const section = resume.data.sections.projects;
	const updateResumeData = useUpdateResumeData();

	const handleReorder = (items: z.infer<typeof projectItemSchema>[]) => {
		updateResumeData((draft) => {
			draft.sections.projects.items = items;
		});
	};

	const buildSubtitle = (item: z.infer<typeof projectItemSchema>) => {
		const parts = [formatDateRange(item), item.website.label].filter((part) => part && part.trim().length > 0);
		return parts.length > 0 ? parts.join(" • ") : undefined;
	};

	return (
		<SectionBase type="projects">
			<Reorder.Group axis="y" values={section.items} onReorder={handleReorder}>
				<AnimatePresence>
					{section.items.map((item) => (
						<SectionItem key={item.id} type="projects" item={item} title={item.name} subtitle={buildSubtitle(item)} />
					))}
				</AnimatePresence>
			</Reorder.Group>

			<SectionAddItemButton type="projects">
				<Trans>Add a new project</Trans>
			</SectionAddItemButton>
		</SectionBase>
	);
}
