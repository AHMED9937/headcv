import type { ResumeData } from "@headcv/schema/resume/data";
import type { Template } from "@headcv/schema/templates";
import type { PdfGenerationPurpose } from "./pdf-generation.protocol";
import { enforceResumeLocale, RESUME_LOCALE } from "@headcv/resume/locale";
import { upgradeLegacyResumeTypography } from "@headcv/resume/readability";
import { generateResumePdfInWorker, PdfGenerationWorkerUnavailableError } from "./pdf-generation-client";

type CreateResumePdfOptions = {
	purpose?: PdfGenerationPurpose;
	sectionMarkerPrefix?: string;
	signal?: AbortSignal;
};

export const createResumePdfBlob = async (data: ResumeData, template?: Template, options?: CreateResumePdfOptions) => {
	const normalizedData = upgradeLegacyResumeTypography(enforceResumeLocale(data));

	try {
		return await generateResumePdfInWorker(
			{
				data: normalizedData,
				...(template ? { template } : {}),
				...(options?.sectionMarkerPrefix ? { sectionMarkerPrefix: options.sectionMarkerPrefix } : {}),
			},
			{ purpose: options?.purpose ?? "export", signal: options?.signal },
		);
	} catch (error) {
		if (!(error instanceof PdfGenerationWorkerUnavailableError)) throw error;

		const [{ createResumePdfBlob: createPdfBlob }, { createSectionTitleResolverForLocale }] = await Promise.all([
			import("@headcv/pdf/browser"),
			import("@/libs/resume/section-title-locale"),
		]);
		const sectionTitleResolver = await createSectionTitleResolverForLocale(RESUME_LOCALE);

		return createPdfBlob({
			data: normalizedData,
			template,
			resolveSectionTitle: sectionTitleResolver,
			sectionMarkerPrefix: options?.sectionMarkerPrefix,
		});
	}
};
