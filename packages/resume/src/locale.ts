import type { ResumeData } from "@headcv/schema/resume/data";

export const RESUME_LOCALE = "en-US" as const;

export function enforceResumeLocale(data: ResumeData): ResumeData {
	return {
		...data,
		metadata: {
			...data.metadata,
			page: {
				...data.metadata.page,
				locale: RESUME_LOCALE,
			},
		},
	};
}
