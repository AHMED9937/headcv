export type Locale = "en" | "ar";

export type ExperienceLevel = "entry" | "mid" | "senior" | "executive";

export type ContentSectionType = "experience" | "summary";

export type JobTitle = {
	id: string;
	title: string;
	category: string;
	experienceLevels: ExperienceLevel[];
};

export type Phrase = {
	id: string;
	sectionType: ContentSectionType;
	jobTitleIds: string[];
	experienceLevels: ExperienceLevel[];
	pattern: string;
	placeholders: string[];
};

export type Skill = {
	id: string;
	nameEn: string;
	nameAr: string;
	category: string;
	jobTitleIds: string[];
	experienceLevels: ExperienceLevel[];
};

export type SummaryFormula = {
	id: string;
	facts: string[];
	pattern: string;
	placeholders: string[];
};
