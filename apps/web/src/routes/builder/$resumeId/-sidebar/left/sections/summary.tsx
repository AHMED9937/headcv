import { SummaryBuilder } from "@/features/builder/summary-builder";
import { useCurrentResume, useUpdateResumeData } from "@/features/resume/builder/draft";
import { SectionBase } from "../shared/section-base";

export function SummarySectionBuilder() {
	const resume = useCurrentResume();
	const section = resume.data.summary;
	const updateResumeData = useUpdateResumeData();

	const onChange = (value: string) => {
		updateResumeData((draft) => {
			draft.summary.content = value;
		});
	};

	const topSkills = resume.data.sections.skills.items.map((item) => item.name).slice(0, 2);
	const locale = "en";

	return (
		<SectionBase type="summary">
			<SummaryBuilder
				value={section.content}
				onChange={onChange}
				targetJobTitleId={resume.data.metadata?.targetJobTitleId || undefined}
				experienceLevel={resume.data.metadata?.experienceLevel ?? "entry"}
				topSkills={topSkills}
				locale={locale}
			/>
		</SectionBase>
	);
}
