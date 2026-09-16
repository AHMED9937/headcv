import type { LayoutPage, ResumeData, Typography } from "@headcv/schema/resume/data";
import type { Template } from "@headcv/schema/templates";
import type { Locale } from "@headcv/utils/locale";
import type { ComponentType } from "react";
import type { SectionTitleResolver } from "./section-title";
import { useMemo } from "react";
import { enforceResumeLocale } from "@headcv/resume/locale";
import { upgradeLegacyResumeTypography } from "@headcv/resume/readability";
import { RenderProvider } from "./context";
import { registerFonts, resumeContentContainsCJK } from "./hooks/use-register-fonts";
import { Document } from "./renderer";
import { getTemplatePage } from "./templates";

export type TemplatePageProps = {
	page: LayoutPage;
	pageIndex: number;
};

export type TemplatePage = ComponentType<TemplatePageProps>;

export type ResumeDocumentProps = {
	data: ResumeData;
	template: Template;
	resolveSectionTitle?: SectionTitleResolver | undefined;
	sectionMarkerPrefix?: string | undefined;
};

const getLayoutPageKey = (page: LayoutPage, pageIndex: number) =>
	`${page.fullWidth ? "full" : "split"}:${page.main.join(",")}:${page.sidebar.join(",")}:${pageIndex}`;

export const ResumeDocument = ({ data, template, resolveSectionTitle, sectionMarkerPrefix }: ResumeDocumentProps) => {
	const TemplatePageComponent = getTemplatePage(template);
	const creationDate = useMemo(() => new Date(), []);
	const normalizedData = useMemo(() => upgradeLegacyResumeTypography(enforceResumeLocale(data)), [data]);
	const hasCjkContent = useMemo(() => resumeContentContainsCJK(normalizedData), [normalizedData]);
	const typography = registerFonts(
		normalizedData.metadata.typography,
		normalizedData.metadata.page.locale as Locale,
		hasCjkContent,
	) as Typography;

	// `registerFonts` widens `fontFamily` to `string | string[]` for CJK
	// fallback (#2986); the cast carries that wider runtime value through
	// `ResumeData` without changing the public schema.
	const resumeData = useMemo(
		() => ({ ...normalizedData, metadata: { ...normalizedData.metadata, typography } }),
		[normalizedData, typography],
	);

	return (
		<RenderProvider
			data={resumeData}
			resolveSectionTitle={resolveSectionTitle}
			sectionMarkerPrefix={sectionMarkerPrefix}
		>
			<Document
				pageMode="useNone"
				creationDate={creationDate}
				producer="HeadCV"
				title={resumeData.basics.name}
				author={resumeData.basics.name}
				creator={resumeData.basics.name}
				subject={resumeData.basics.headline}
				language={resumeData.metadata.page.locale}
			>
				{resumeData.metadata.layout.pages.map((page, index) => (
					<TemplatePageComponent key={getLayoutPageKey(page, index)} page={page} pageIndex={index} />
				))}
			</Document>
		</RenderProvider>
	);
};
