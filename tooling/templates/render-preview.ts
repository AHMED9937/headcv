import type { Template } from "@headcv/schema/templates";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createCanvas } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import React from "react";
import { sampleResumeData } from "@headcv/schema/resume/sample";
import { templateSchema } from "@headcv/schema/templates";

const PREVIEW_WIDTH = 1055;
const JPEG_QUALITY = 90;

// The app build injects the classic JSX runtime for React-PDF. The standalone
// preview command provides the same runtime before loading the PDF package.
Object.assign(globalThis, { React });

const createPreviewData = (template: Template) => {
	const data = structuredClone(sampleResumeData);
	data.metadata.template = template;
	data.picture.hidden = true;

	if (template !== "scizor") return data;

	data.summary.title = "Profile";
	data.sections.experience.title = "Professional Experience";
	const primaryExperience = data.sections.experience.items[0];
	const primaryEducation = data.sections.education.items[0];
	if (!primaryExperience || !primaryEducation)
		throw new Error("Scizor preview requires sample experience and education");

	primaryExperience.description =
		"<ul><li><p>Led gameplay development for a cross-platform title built in Unreal Engine 5.</p></li><li><p>Architected combat and AI systems supporting 15+ enemy types.</p></li><li><p>Improved editor workflows and reduced iteration time by 40%.</p></li></ul>";
	data.sections.experience.items.push({
		...structuredClone(primaryExperience),
		id: "019bef5a-93e4-7746-ad39-44d8cec98ca5",
		company: "Northstar Interactive",
		position: "Game Developer",
		location: "Vancouver, Canada",
		period: "June 2019 - February 2022",
		description:
			"<ul><li><p>Shipped two commercial games in collaboration with design, art, and QA teams.</p></li><li><p>Built reusable gameplay tools that accelerated feature delivery across projects.</p></li></ul>",
	});
	primaryEducation.description = "<p>Concentration in Game Development and Computer Graphics.</p>";
	data.sections.education.items.push({
		...structuredClone(primaryEducation),
		id: "019bef5a-93e4-7746-ad39-48455f6cef9f",
		school: "British Columbia Institute of Technology",
		degree: "Diploma",
		area: "Interactive Media",
		grade: "",
		location: "Vancouver, Canada",
		period: "2012 - 2014",
		description: "",
	});
	const sixthSkill = data.sections.skills.items[5];
	if (sixthSkill) sixthSkill.hidden = false;
	const primaryLanguage = data.sections.languages.items[0];
	if (primaryLanguage) {
		data.sections.languages.items.push({
			...structuredClone(primaryLanguage),
			id: "019bef5a-93e4-7746-ad39-768670459359",
			language: "Spanish",
			fluency: "Professional",
			level: 4,
		});
	}
	data.metadata.layout.pages = [
		{
			fullWidth: true,
			main: ["summary", "experience", "education", "skills", "languages", "awards", "interests"],
			sidebar: [],
		},
	];
	data.sections.experience.items = data.sections.experience.items.slice(0, 2);
	data.sections.education.items = data.sections.education.items.slice(0, 2);
	data.sections.skills.items = data.sections.skills.items.slice(0, 6);
	data.sections.languages.items = data.sections.languages.items.slice(0, 3);
	data.sections.interests.items = data.sections.interests.items.slice(0, 3);
	data.metadata.design.level = { icon: "", type: "circle" };
	data.metadata.page = {
		...data.metadata.page,
		gapX: 8,
		gapY: 6,
		marginX: 40,
		marginY: 32,
	};
	data.metadata.typography = {
		body: {
			fontFamily: "IBM Plex Serif",
			fontWeights: ["400", "700"],
			fontSize: 9,
			lineHeight: 1.3,
		},
		heading: {
			fontFamily: "IBM Plex Serif",
			fontWeights: ["400", "700"],
			fontSize: 10.5,
			lineHeight: 1.2,
		},
	};

	return data;
};

const renderFirstPage = async (pdfBytes: Uint8Array) => {
	const loadingTask = getDocument({ data: pdfBytes });
	const document = await loadingTask.promise;
	if (document.numPages !== 1) {
		await document.destroy();
		throw new Error(`Template marketing previews must be one page; generated ${document.numPages} pages.`);
	}
	const page = await document.getPage(1);
	const baseViewport = page.getViewport({ scale: 1 });
	const viewport = page.getViewport({ scale: PREVIEW_WIDTH / baseViewport.width });
	const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
	const context = canvas.getContext("2d");

	await page.render({ canvas: canvas as never, canvasContext: context as never, viewport }).promise;
	const jpeg = await canvas.encode("jpeg", JPEG_QUALITY);
	await document.destroy();
	return jpeg;
};

const template = templateSchema.parse(process.argv[2] ?? "scizor");
const { createResumePdfFile } = await import("@headcv/pdf/server");
const outputRoot = process.argv[3] ?? fileURLToPath(new URL("../../apps/web/public/templates/", import.meta.url));
const pdfDirectory = `${outputRoot}/pdf`;
const jpgDirectory = `${outputRoot}/jpg`;
await Promise.all([mkdir(pdfDirectory, { recursive: true }), mkdir(jpgDirectory, { recursive: true })]);

const pdfFile = await createResumePdfFile({
	data: createPreviewData(template),
	filename: `${template}.pdf`,
	template,
});
const pdfBytes = new Uint8Array(await pdfFile.arrayBuffer());
const jpeg = await renderFirstPage(pdfBytes.slice());

await Promise.all([
	writeFile(`${pdfDirectory}/${template}.pdf`, pdfBytes),
	writeFile(`${jpgDirectory}/${template}.jpg`, jpeg),
]);

console.log(`Rendered ${template} preview (${PREVIEW_WIDTH}px wide).`);
