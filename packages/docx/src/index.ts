import type { ResumeData } from "@headcv/schema/resume/data";
import { Packer } from "docx";
import { buildDocument } from "./builder";
import { loadPicture } from "./picture";

/** Builds a DOCX file from resume data and returns it as a Blob. */
export async function buildDocx(data: ResumeData): Promise<Blob> {
	const picture = await loadPicture(data.picture);
	const doc = buildDocument(data, picture);
	return Packer.toBlob(doc);
}
