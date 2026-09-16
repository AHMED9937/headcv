import type { ResumeData } from "@headcv/schema/resume/data";
import type { Template } from "@headcv/schema/templates";
import type { SectionTitleResolver } from "./section-title";
import { createElement } from "react";
import { ResumeDocument } from "./document";
import { pdf } from "./renderer";

type CreateResumePdfBlobOptions = {
	data: ResumeData;
	template?: Template | undefined;
	resolveSectionTitle?: SectionTitleResolver | undefined;
	sectionMarkerPrefix?: string | undefined;
};

export const createResumePdfBlob = async ({
	data,
	template,
	resolveSectionTitle,
	sectionMarkerPrefix,
}: CreateResumePdfBlobOptions) => {
	const document = createElement(ResumeDocument, {
		data,
		template: template ?? data.metadata.template,
		resolveSectionTitle,
		sectionMarkerPrefix,
	}) as Parameters<typeof pdf>[0];

	return pdf(document).toBlob();
};
