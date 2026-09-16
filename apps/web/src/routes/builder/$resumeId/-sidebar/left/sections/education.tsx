import type { educationItemSchema } from "@headcv/schema/resume/data";
import type z from "zod";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { AnimatePresence, Reorder } from "motion/react";
import { useState } from "react";
import { Button } from "@headcv/ui/components/button";
import { cn } from "@headcv/utils/style";
import { useCurrentResume, useUpdateResumeData } from "@/features/resume/builder/draft";
import { SectionBase } from "../shared/section-base";
import { SectionAddItemButton, SectionItem } from "../shared/section-item";

export function EducationSectionBuilder() {
	const resume = useCurrentResume();
	const section = resume.data.sections.education;
	const updateResumeData = useUpdateResumeData();
	const [promptDismissed, setPromptDismissed] = useState(false);

	const handleReorder = (items: z.infer<typeof educationItemSchema>[]) => {
		updateResumeData((draft) => {
			draft.sections.education.items = items;
		});
	};

	const experienceLevel = resume.data.metadata?.experienceLevel ?? "entry";
	const hasEducation = section.items.length > 0;
	const hasExperience = resume.data.sections.experience.items.length > 0;
	const mainLayout = resume.data.metadata?.layout?.pages?.[0]?.main ?? [];
	const educationBeforeExperience =
		mainLayout.indexOf("education") >= 0 && mainLayout.indexOf("education") < mainLayout.indexOf("experience");
	const showReorderPrompt =
		experienceLevel === "entry" && hasEducation && !hasExperience && !educationBeforeExperience && !promptDismissed;

	const handleConfirmReorder = () => {
		updateResumeData((draft) => {
			for (const page of draft.metadata.layout.pages) {
				const expIndex = page.main.indexOf("experience");
				const eduIndex = page.main.indexOf("education");
				if (expIndex === -1 || eduIndex === -1) continue;
				page.main.splice(eduIndex, 1);
				page.main.splice(expIndex, 0, "education");
			}
		});
		setPromptDismissed(true);
	};

	return (
		<SectionBase type="education" className={cn("rounded-md border", section.items.length === 0 && "border-dashed")}>
			{showReorderPrompt && (
				<div className="rounded-md border border-primary/20 border-l-4 bg-primary/5 p-3 text-sm">
					<p className="mb-2 font-medium text-primary">{t`Education before experience?`}</p>
					<p className="mb-3 text-muted-foreground">
						<Trans>
							Since you're early in your career, placing Education before Work Experience can highlight your strengths.
							You can undo this later in the layout settings.
						</Trans>
					</p>
					<div className="flex gap-2">
						<Button size="sm" variant="outline" onClick={() => setPromptDismissed(true)}>
							{t`Keep current order`}
						</Button>
						<Button size="sm" onClick={handleConfirmReorder}>
							{t`Move education up`}
						</Button>
					</div>
				</div>
			)}

			<Reorder.Group axis="y" values={section.items} onReorder={handleReorder}>
				<AnimatePresence>
					{section.items.map((item) => (
						<SectionItem key={item.id} type="education" item={item} title={item.school} subtitle={item.degree} />
					))}
				</AnimatePresence>
			</Reorder.Group>

			<SectionAddItemButton type="education">
				<Trans>Add a new education</Trans>
			</SectionAddItemButton>
		</SectionBase>
	);
}
