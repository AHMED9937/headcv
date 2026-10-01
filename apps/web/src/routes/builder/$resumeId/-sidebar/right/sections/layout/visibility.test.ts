import type { ResumeData } from "@headcv/schema/resume/data";
import { describe, expect, it } from "vitest";
import { defaultResumeData } from "@headcv/schema/resume/default";
import {
	filterEditorLayoutSectionIds,
	filterVisibleLayoutSectionIds,
	isHiddenEditorSection,
	isVisibleEditorSection,
} from "./visibility";

const createResumeData = (): ResumeData => structuredClone(defaultResumeData);

describe("isVisibleEditorSection", () => {
	it("keeps item-backed sections visible when every item is hidden", () => {
		const data = createResumeData();
		data.sections.experience.items = [{ hidden: true, company: "HeadCV" }] as never;
		data.sections.references.items = [{ hidden: true, name: "Hidden Reference" }] as never;

		expect(isVisibleEditorSection("experience", data)).toBe(true);
		expect(isVisibleEditorSection("references", data)).toBe(true);
	});

	it("still hides sections with no items at all", () => {
		const data = createResumeData();
		data.sections.experience.items = [];
		expect(isVisibleEditorSection("experience", data)).toBe(false);
	});

	it("still hides explicitly hidden sections", () => {
		const data = createResumeData();
		data.sections.experience.hidden = true;
		data.sections.experience.items = [{ hidden: false, company: "HeadCV" }] as never;
		expect(isVisibleEditorSection("experience", data)).toBe(false);
	});

	it("keeps a hidden summary available to the editor", () => {
		const data = createResumeData();
		data.summary.content = "<p>Available for staff roles.</p>";
		data.summary.hidden = true;

		expect(isVisibleEditorSection("summary", data)).toBe(true);
		expect(isHiddenEditorSection("summary", data)).toBe(true);
		expect(filterEditorLayoutSectionIds(["summary"], data)).toEqual(["summary"]);
	});
});

describe("filterVisibleLayoutSectionIds", () => {
	it("removes item-backed sections with no visible items", () => {
		const data = createResumeData();
		data.sections.experience.items = [
			{ hidden: false, company: "HeadCV" },
			{ hidden: true, company: "Hidden Company" },
		] as never;
		data.sections.references.items = [{ hidden: true, name: "Hidden Reference" }] as never;

		expect(filterVisibleLayoutSectionIds(["experience", "volunteer", "references"], data)).toEqual(["experience"]);
	});

	it("keeps layout order for non-empty summary and custom sections", () => {
		const data = createResumeData();
		data.summary.content = "<p>Available for staff roles.</p>";
		data.customSections = [
			{
				id: "custom-visible",
				type: "projects",
				title: "Selected Work",
				columns: 1,
				hidden: false,
				items: [{ hidden: false, name: "Resume Builder" }],
			},
			{
				id: "custom-empty",
				type: "projects",
				title: "Empty Work",
				columns: 1,
				hidden: false,
				items: [],
			},
		] as never;

		expect(filterVisibleLayoutSectionIds(["custom-empty", "summary", "custom-visible"], data)).toEqual([
			"summary",
			"custom-visible",
		]);
	});
});
