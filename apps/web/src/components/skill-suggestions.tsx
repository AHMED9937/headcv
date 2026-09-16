import type { ExperienceLevel, Locale } from "@headcv/content";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { PlusIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { getSkills, normalizeSkillName } from "@headcv/content";
import { Button } from "@headcv/ui/components/button";
import { Checkbox } from "@headcv/ui/components/checkbox";
import { generateId } from "@headcv/utils/string";
import { useCurrentResume, useUpdateResumeData } from "@/features/resume/builder/draft";

export type SkillSuggestionsProps = {
	jobTitleId?: string;
	experienceLevel?: ExperienceLevel;
	locale?: Locale;
};

export function SkillSuggestions({ jobTitleId, experienceLevel = "entry", locale = "en" }: SkillSuggestionsProps) {
	const resume = useCurrentResume();
	const updateResumeData = useUpdateResumeData();
	const existingNames = useMemo(
		() => new Set(resume.data.sections.skills.items.map((item) => normalizeSkillName(item.name))),
		[resume.data.sections.skills.items],
	);

	const suggestedSkills = useMemo(
		() =>
			getSkills({ jobTitleId, experienceLevel, locale }).filter(
				(skill) => !existingNames.has(normalizeSkillName(skill.nameEn)),
			),
		[jobTitleId, experienceLevel, locale, existingNames],
	);

	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	if (suggestedSkills.length === 0) return null;

	const toggleSkill = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const handleAddSelected = () => {
		const skillsToAdd = suggestedSkills.filter((skill) => selectedIds.has(skill.id));
		if (skillsToAdd.length === 0) return;

		updateResumeData((draft) => {
			for (const skill of skillsToAdd) {
				draft.sections.skills.items.push({
					id: generateId(),
					hidden: false,
					icon: "acorn",
					iconColor: "",
					name: skill.nameEn,
					proficiency: "",
					level: 0,
					keywords: [],
				});
			}
		});

		setSelectedIds(new Set());
	};

	return (
		<div className="space-y-3 rounded-md border bg-muted p-3">
			<div className="flex items-center justify-between">
				<h4 className="font-semibold text-sm">
					<Trans>Suggested skills for this role</Trans>
				</h4>
				<Button
					type="button"
					size="xs"
					variant="secondary"
					disabled={selectedIds.size === 0}
					onClick={handleAddSelected}
				>
					<PlusIcon className="size-3.5" />
					{t`Add selected`}
				</Button>
			</div>

			<div className="flex flex-wrap gap-2">
				{suggestedSkills.map((skill) => (
					<label
						key={skill.id}
						htmlFor={`suggest-skill-${skill.id}`}
						className="flex cursor-pointer items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-sm transition-colors hover:bg-accent"
					>
						<Checkbox
							id={`suggest-skill-${skill.id}`}
							checked={selectedIds.has(skill.id)}
							onCheckedChange={() => toggleSkill(skill.id)}
						/>
						{skill.nameEn}
					</label>
				))}
			</div>
		</div>
	);
}
