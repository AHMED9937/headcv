import type { ResumeData } from "@headcv/schema/resume/data";
import type { Template } from "@headcv/schema/templates";
import { useMemo } from "react";
import { ResumeDocument } from "@headcv/pdf/document";
import { enforceResumeLocale, RESUME_LOCALE } from "@headcv/resume/locale";
import { upgradeLegacyResumeTypography } from "@headcv/resume/readability";
import { useSectionTitleResolver } from "@/libs/resume/section-title-locale";

export const useLocalizedResumeDocument = (data?: ResumeData, template?: Template) => {
	const sectionTitleResolver = useSectionTitleResolver(data ? RESUME_LOCALE : undefined);

	return useMemo(() => {
		if (!data || !sectionTitleResolver) return null;

		const normalizedData = upgradeLegacyResumeTypography(enforceResumeLocale(data));
		return (
			<ResumeDocument
				data={normalizedData}
				template={template ?? normalizedData.metadata.template}
				resolveSectionTitle={sectionTitleResolver}
			/>
		);
	}, [data, template, sectionTitleResolver]);
};
