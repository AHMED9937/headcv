import type { ResumeData } from "@headcv/schema/resume/data";
import type { Template } from "@headcv/schema/templates";

export type PdfGenerationPurpose = "export" | "preview";

export type PdfGenerationRequest = {
	id: number;
	data: ResumeData;
	template?: Template;
	sectionMarkerPrefix?: string;
};

export type PdfGenerationSuccess = {
	id: number;
	ok: true;
	bytes: ArrayBuffer;
};

export type PdfGenerationFailure = {
	id: number;
	ok: false;
	error: {
		message: string;
		name: string;
		stack?: string;
	};
};

export type PdfGenerationResponse = PdfGenerationSuccess | PdfGenerationFailure;
