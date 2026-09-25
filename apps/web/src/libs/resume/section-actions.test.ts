import { describe, expect, it } from "vitest";
import { produce } from "immer";
import { defaultResumeData } from "@headcv/schema/resume/default";
import {
	appendCustomSectionToEnd,
	createSectionItem,
	deleteCustomSection,
	deleteSectionItem,
	ensureSectionInLayout,
	toggleCustomSectionHidden,
	toggleSectionItemHidden,
	updateSectionItem,
} from "./section-actions";

describe("appendCustomSectionToEnd", () => {
	const section = {
		id: "custom-last",
		type: "summary" as const,
		title: "Last section",
		columns: 1,
		hidden: false,
		items: [],
	};

	it("appends a new section after the final main-column section on the final page", () => {
		const initial = produce(defaultResumeData, (draft) => {
			draft.metadata.layout.pages.push({ fullWidth: false, main: ["projects"], sidebar: ["skills"] });
		});
		const result = produce(initial, (draft) => {
			appendCustomSectionToEnd(draft, section);
		});

		expect(result.customSections.at(-1)).toEqual(section);
		expect(result.metadata.layout.pages.at(-1)?.main).toEqual(["projects", section.id]);
		expect(result.metadata.layout.pages.at(-1)?.sidebar).toEqual(["skills"]);
	});

	it("creates a final page when importing malformed data without layout pages", () => {
		const initial = produce(defaultResumeData, (draft) => {
			draft.metadata.layout.pages = [];
		});
		const result = produce(initial, (draft) => {
			appendCustomSectionToEnd(draft, section);
		});

		expect(result.metadata.layout.pages).toEqual([{ fullWidth: false, main: [section.id], sidebar: [] }]);
	});

	it("does not move or duplicate an existing section", () => {
		const initial = produce(defaultResumeData, (draft) => {
			draft.customSections.push(section);
			draft.metadata.layout.pages[0]?.sidebar.push(section.id);
		});
		const result = produce(initial, (draft) => {
			appendCustomSectionToEnd(draft, { ...section, title: "Changed" });
		});

		expect(result.customSections).toHaveLength(1);
		expect(result.customSections[0]?.title).toBe("Last section");
		expect(result.metadata.layout.pages[0]?.sidebar).toContain(section.id);
		expect(result.metadata.layout.pages[0]?.main).not.toContain(section.id);
	});
});

describe("createSectionItem", () => {
	it("appends to a built-in section's items array", () => {
		const result = produce(defaultResumeData, (draft) => {
			createSectionItem(draft, "skills", { id: "1", name: "Go" });
		});
		expect(result.sections.skills.items).toHaveLength(1);
		expect((result.sections.skills.items[0] as { name?: string })?.name).toBe("Go");
	});

	it("appends to a custom section by id", () => {
		const initial = produce(defaultResumeData, (draft) => {
			draft.customSections.push({
				id: "custom-1",
				type: "cover-letter",
				title: "Cover Letter",
				columns: 1,
				hidden: false,
				items: [],
			});
		});

		const result = produce(initial, (draft) => {
			createSectionItem(draft, "skills", { id: "1", text: "Custom item" }, "custom-1");
		});

		const customSection = result.customSections.find((s) => s.id === "custom-1");
		expect(customSection?.items).toHaveLength(1);
		// Built-in section is untouched
		expect(result.sections.skills.items).toHaveLength(0);
	});

	it("does nothing when customSectionId does not match", () => {
		const result = produce(defaultResumeData, (draft) => {
			createSectionItem(draft, "skills", { id: "1", name: "x" }, "non-existent");
		});
		// Skills not touched, no custom section to modify
		expect(result.sections.skills.items).toHaveLength(0);
	});

	it("replaces an existing built-in item with the same id instead of duplicating", () => {
		const initial = produce(defaultResumeData, (draft) => {
			createSectionItem(draft, "skills", { id: "1", name: "Go", level: 3 });
		});

		const result = produce(initial, (draft) => {
			createSectionItem(draft, "skills", { id: "1", name: "Go", level: 5 });
		});

		expect(result.sections.skills.items).toHaveLength(1);
		expect((result.sections.skills.items[0] as { level?: number }).level).toBe(5);
	});

	it("replaces an existing custom-section item with the same id instead of duplicating", () => {
		const initial = produce(defaultResumeData, (draft) => {
			draft.customSections.push({
				id: "custom-1",
				type: "cover-letter",
				title: "Cover Letter",
				columns: 1,
				hidden: false,
				items: [{ id: "1", content: "Draft", hidden: false }],
			});
		});

		const result = produce(initial, (draft) => {
			createSectionItem(draft, "skills", { id: "1", content: "Final", hidden: false }, "custom-1");
		});

		const customSection = result.customSections.find((s) => s.id === "custom-1");
		expect(customSection?.items).toHaveLength(1);
		expect((customSection?.items[0] as { content?: string }).content).toBe("Final");
	});
});

describe("updateSectionItem", () => {
	it("replaces the matching item in a built-in section", () => {
		const initial = produce(defaultResumeData, (draft) => {
			createSectionItem(draft, "skills", { id: "abc", name: "Go", level: 4 });
		});

		const result = produce(initial, (draft) => {
			updateSectionItem(draft, "skills", { id: "abc", name: "Go", level: 5 });
		});

		const item = result.sections.skills.items[0] as { id?: string; name?: string; level?: number };
		expect(item?.level).toBe(5);
	});

	it("does nothing when item id does not exist", () => {
		const initial = produce(defaultResumeData, (draft) => {
			createSectionItem(draft, "skills", { id: "abc", name: "Go" });
		});

		const before = JSON.stringify(initial.sections.skills);
		const result = produce(initial, (draft) => {
			updateSectionItem(draft, "skills", { id: "non-existent", name: "X" });
		});
		expect(JSON.stringify(result.sections.skills)).toBe(before);
	});

	it("replaces the matching item in a custom section", () => {
		const initial = produce(defaultResumeData, (draft) => {
			draft.customSections.push({
				id: "custom-1",
				type: "cover-letter",
				title: "",
				columns: 1,
				hidden: false,
				items: [{ id: "x", value: "old" } as never],
			});
		});

		const result = produce(initial, (draft) => {
			updateSectionItem(draft, "skills", { id: "x", value: "new" }, "custom-1");
		});

		const customSection = result.customSections.find((s) => s.id === "custom-1");
		expect((customSection?.items[0] as { value?: string }).value).toBe("new");
	});

	it("does nothing when custom section is not found", () => {
		const before = JSON.stringify(defaultResumeData);
		const result = produce(defaultResumeData, (draft) => {
			updateSectionItem(draft, "skills", { id: "x", value: "new" }, "non-existent");
		});
		expect(JSON.stringify(result)).toBe(before);
	});
});

describe("shared item controls", () => {
	it("adapts built-in summary controls to its legacy section-level shape", () => {
		const created = produce(defaultResumeData, (draft) => {
			createSectionItem(draft, "summary", { id: "built-in-summary", hidden: false, content: "<p>Draft</p>" });
		});
		expect(created.summary.content).toBe("<p>Draft</p>");

		const updated = produce(created, (draft) => {
			updateSectionItem(draft, "summary", {
				id: "built-in-summary",
				hidden: false,
				content: "<p>Final</p>",
			});
			toggleSectionItemHidden(draft, "summary", "built-in-summary");
		});
		expect(updated.summary.content).toBe("<p>Final</p>");
		expect(updated.summary.hidden).toBe(true);

		const deleted = produce(updated, (draft) => {
			deleteSectionItem(draft, "summary", "built-in-summary");
		});
		expect(deleted.summary.content).toBe("");
	});

	it("toggles visibility for a built-in item", () => {
		const initial = produce(defaultResumeData, (draft) => {
			createSectionItem(draft, "skills", { id: "skill-1", hidden: false, name: "TypeScript" });
		});
		const result = produce(initial, (draft) => {
			toggleSectionItemHidden(draft, "skills", "skill-1");
		});
		expect(result.sections.skills.items[0]?.hidden).toBe(true);
	});

	it("deletes an item from a custom section", () => {
		const initial = produce(defaultResumeData, (draft) => {
			draft.customSections.push({
				id: "custom-1",
				type: "cover-letter",
				title: "",
				columns: 1,
				hidden: false,
				items: [{ id: "item-1", hidden: false, content: "Text" }],
			});
		});
		const result = produce(initial, (draft) => {
			deleteSectionItem(draft, "skills", "item-1", "custom-1");
		});
		expect(result.customSections[0]?.items).toHaveLength(0);
	});

	it("hiding the only entry keeps it stored and toggles back without deleting", () => {
		const initial = produce(defaultResumeData, (draft) => {
			createSectionItem(draft, "experience", {
				id: "exp-1",
				hidden: false,
				company: "Acme",
				position: "Engineer",
				startDate: "2022-01",
				endDate: "",
			});
		});

		const hidden = produce(initial, (draft) => {
			toggleSectionItemHidden(draft, "experience", "exp-1");
		});
		expect(hidden.sections.experience.items).toHaveLength(1);
		expect(hidden.sections.experience.items[0]?.hidden).toBe(true);

		const restored = produce(hidden, (draft) => {
			toggleSectionItemHidden(draft, "experience", "exp-1");
		});
		expect(restored.sections.experience.items[0]?.hidden).toBe(false);
	});

	it("hiding an entire section preserves it in state and toggles back", () => {
		const initial = produce(defaultResumeData, (draft) => {
			draft.sections.experience.hidden = false;
		});

		const hidden = produce(initial, (draft) => {
			draft.sections.experience.hidden = true;
		});
		expect(hidden.sections.experience.hidden).toBe(true);
		expect(hidden.sections.experience.items).toHaveLength(0);

		const restored = produce(hidden, (draft) => {
			draft.sections.experience.hidden = false;
		});
		expect(restored.sections.experience.hidden).toBe(false);
	});
});

describe("shared custom-section controls", () => {
	it("toggles visibility without changing section contents", () => {
		const initial = produce(defaultResumeData, (draft) => {
			draft.customSections.push({
				id: "custom-1",
				type: "summary",
				title: "Summary",
				columns: 1,
				hidden: false,
				items: [],
			});
		});

		const result = produce(initial, (draft) => toggleCustomSectionHidden(draft, "custom-1"));

		expect(result.customSections[0]?.hidden).toBe(true);
	});

	it("deletes the section and every layout reference", () => {
		const initial = produce(defaultResumeData, (draft) => {
			draft.customSections.push({
				id: "custom-1",
				type: "summary",
				title: "Summary",
				columns: 1,
				hidden: false,
				items: [],
			});
			draft.metadata.layout.pages[0]?.main.push("custom-1");
			draft.metadata.layout.pages[0]?.sidebar.push("custom-1");
		});

		const result = produce(initial, (draft) => deleteCustomSection(draft, "custom-1"));

		expect(result.customSections).toHaveLength(0);
		expect(result.metadata.layout.pages[0]?.main).not.toContain("custom-1");
		expect(result.metadata.layout.pages[0]?.sidebar).not.toContain("custom-1");
	});
});

describe("ensureSectionInLayout", () => {
	const withPages = (pages: typeof defaultResumeData.metadata.layout.pages) =>
		produce(defaultResumeData, (draft) => {
			draft.metadata.layout.pages = pages;
			draft.sections.awards.hidden = true;
		});

	it("un-hides the section and adds it to the sidebar of the last page when missing", () => {
		const base = withPages([{ fullWidth: false, main: ["summary"], sidebar: ["skills"] }]);
		const result = produce(base, (draft) => ensureSectionInLayout(draft, "awards"));

		expect(result.sections.awards.hidden).toBe(false);
		expect(result.metadata.layout.pages[0]?.sidebar).toEqual(["skills", "awards"]);
	});

	it("uses the main column on full-width pages and for main-column sections", () => {
		const base = withPages([{ fullWidth: true, main: ["summary"], sidebar: [] }]);
		const result = produce(base, (draft) => {
			ensureSectionInLayout(draft, "awards");
			ensureSectionInLayout(draft, "projects");
		});

		expect(result.metadata.layout.pages[0]?.main).toEqual(["summary", "awards", "projects"]);
	});

	it("never moves a section that is already placed", () => {
		const base = withPages([
			{ fullWidth: false, main: ["awards"], sidebar: [] },
			{ fullWidth: false, main: [], sidebar: [] },
		]);
		const result = produce(base, (draft) => ensureSectionInLayout(draft, "awards"));

		expect(result.metadata.layout.pages).toEqual(base.metadata.layout.pages);
	});

	it("places the section when its first entry is saved", () => {
		const base = withPages([{ fullWidth: false, main: ["summary"], sidebar: [] }]);
		const result = produce(base, (draft) => createSectionItem(draft, "awards", { id: "award-1", title: "Prize" }));

		expect(result.sections.awards.items).toHaveLength(1);
		expect(result.metadata.layout.pages[0]?.sidebar).toEqual(["awards"]);
	});
});
