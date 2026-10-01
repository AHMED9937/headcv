// @vitest-environment happy-dom

import { beforeAll, describe, expect, it } from "vitest";
import { i18n } from "@lingui/core";
import { isValidElement } from "react";
import { defaultResumeData } from "@headcv/schema/resume/default";
import {
	designWorkspaceSections,
	getLayoutOrderedLeftSidebarSections,
	getSectionIcon,
	getSectionTitle,
	leftSidebarSections,
	rightSidebarSections,
} from "./section";

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

const ALL_SECTIONS = [...leftSidebarSections, ...rightSidebarSections, "cover-letter"] as const;

describe("getSectionTitle", () => {
	it("returns a non-empty string for every known sidebar section", () => {
		for (const section of ALL_SECTIONS) {
			const title = getSectionTitle(section);
			expect(typeof title, section).toBe("string");
			expect(title.length, section).toBeGreaterThan(0);
		}
	});

	it("returns distinct titles for each section", () => {
		const titles = ALL_SECTIONS.map((section) => getSectionTitle(section));
		expect(new Set(titles).size).toBe(titles.length);
	});
});

describe("getSectionIcon", () => {
	it("returns a React element for every known sidebar section", () => {
		for (const section of ALL_SECTIONS) {
			const icon = getSectionIcon(section);
			expect(isValidElement(icon), section).toBe(true);
		}
	});

	it("forwards icon props such as className", () => {
		const icon = getSectionIcon("skills", { className: "custom-class" });
		const props = (icon as React.ReactElement).props as { className?: string };
		expect(props.className).toContain("custom-class");
		// Always merges the shrink-0 baseline class.
		expect(props.className).toContain("shrink-0");
	});
});

describe("sidebar section collections", () => {
	it("orders the content editor from the page and column layout", () => {
		const data = structuredClone(defaultResumeData);
		data.customSections = [
			{
				id: "custom-projects",
				type: "projects",
				title: "Selected Work",
				columns: 1,
				hidden: false,
				items: [],
			},
		];
		data.metadata.layout.pages = [
			{
				fullWidth: false,
				main: ["summary", "education", "experience", "custom-projects", "projects"],
				sidebar: ["skills", "languages"],
			},
		];

		expect(getLayoutOrderedLeftSidebarSections(data).slice(0, 10)).toEqual([
			"picture",
			"basics",
			"summary",
			"education",
			"experience",
			"custom",
			"projects",
			"skills",
			"languages",
			"interests",
		]);
	});

	it("deduplicates the custom-section editor and retains unplaced sections", () => {
		const data = structuredClone(defaultResumeData);
		data.customSections = [
			{ id: "custom-one", type: "summary", title: "One", columns: 1, hidden: false, items: [] },
			{ id: "custom-two", type: "summary", title: "Two", columns: 1, hidden: false, items: [] },
		];
		data.metadata.layout.pages = [{ fullWidth: true, main: ["custom-one", "education", "custom-two"], sidebar: [] }];

		const sections = getLayoutOrderedLeftSidebarSections(data);
		expect(sections.filter((section) => section === "custom")).toHaveLength(1);
		expect(sections).toContain("summary");
		expect(sections).toContain("experience");
		expect(sections.at(-1)).toBe("ai-review");
	});

	it("expose the documented left-sidebar set", () => {
		expect(leftSidebarSections).toContain("picture");
		expect(leftSidebarSections).toContain("basics");
		expect(leftSidebarSections).toContain("experience");
		expect(leftSidebarSections).toContain("custom");
	});

	it("expose the documented right-sidebar set", () => {
		expect(rightSidebarSections).toContain("template");
		expect(rightSidebarSections).toContain("design");
		expect(rightSidebarSections).toContain("export");
	});

	it("expose the intended editable sections in the Design workspace", () => {
		expect(designWorkspaceSections).toEqual(["template", "design", "typography", "layout", "page", "notes"]);
		for (const section of designWorkspaceSections) {
			expect(rightSidebarSections).toContain(section);
		}
	});

	it("do not overlap (every section belongs to exactly one sidebar)", () => {
		const overlap = leftSidebarSections.filter((s) => (rightSidebarSections as readonly string[]).includes(s));
		expect(overlap).toEqual([]);
	});
});
