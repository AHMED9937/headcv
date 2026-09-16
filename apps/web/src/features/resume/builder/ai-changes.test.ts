import { beforeAll, describe, expect, it } from "vitest";
import { i18n } from "@lingui/core";
import { defaultResumeData } from "@headcv/schema/resume/default";

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

import {
	aiChangedSectionClassName,
	buildSectionInversePatch,
	decodeJsonPointerPath,
	getAffectedPreviewSectionIds,
	getAffectedSectionFromPath,
	getAffectedSections,
	getSectionDiffs,
	getSectionOperations,
	getSectionReviewGroups,
	getSectionValueFromResumeData,
	getValueAtJsonPointer,
} from "./ai-changes";

const sampleData = {
	basics: { firstName: "A", lastName: "B" },
	summary: { content: "Hello" },
	profiles: [],
	sections: {
		skills: {
			items: [
				{ id: "1", keywords: ["TypeScript", "React"] },
				{ id: "2", keywords: ["Node"] },
			],
		},
		experience: {
			items: [{ id: "x", company: "Acme", position: "Dev" }],
		},
		education: { items: [] },
		custom: {},
	},
} as const;

describe("decodeJsonPointerPath", () => {
	it("splits a JSON pointer into segments", () => {
		expect(decodeJsonPointerPath("/summary/content")).toEqual(["summary", "content"]);
	});

	it("decodes escaped tokens", () => {
		expect(decodeJsonPointerPath("/sections/foo~1bar")).toEqual(["sections", "foo/bar"]);
		expect(decodeJsonPointerPath("/sections/foo~0bar")).toEqual(["sections", "foo~bar"]);
	});

	it("returns empty array for non-absolute pointers", () => {
		expect(decodeJsonPointerPath("summary")).toEqual([]);
	});
});

describe("getValueAtJsonPointer", () => {
	it("retrieves values by pointer", () => {
		expect(getValueAtJsonPointer(sampleData, "/summary/content")).toBe("Hello");
		expect(getValueAtJsonPointer(sampleData, "/sections/skills/items/0/keywords/1")).toBe("React");
	});

	it("returns undefined for missing paths", () => {
		expect(getValueAtJsonPointer(sampleData, "/missing/path")).toBeUndefined();
		expect(getValueAtJsonPointer(sampleData, "/sections/skills/items/9")).toBeUndefined();
	});
});

describe("getAffectedSectionFromPath", () => {
	it("detects sections nested under /sections", () => {
		expect(getAffectedSectionFromPath("/sections/skills/items/0/keywords")).toBe("skills");
		expect(getAffectedSectionFromPath("/sections/experience/items/0/company")).toBe("experience");
	});

	it("detects top-level sections", () => {
		expect(getAffectedSectionFromPath("/summary/content")).toBe("summary");
		expect(getAffectedSectionFromPath("/basics/firstName")).toBe("basics");
	});

	it("returns null for unknown paths", () => {
		expect(getAffectedSectionFromPath("/metadata/foo")).toBeNull();
	});
});

describe("getAffectedSections", () => {
	it("collects affected sections from replace operations", () => {
		const operations = [
			{ op: "replace", path: "/summary/content", value: "Updated" },
			{ op: "replace", path: "/sections/skills/items/0/keywords", value: ["JS"] },
		] as const;
		expect(getAffectedSections(operations as never)).toEqual(new Set(["summary", "skills"]));
	});

	it("includes source section for move operations", () => {
		const operations = [
			{ op: "move", path: "/sections/experience/items/0", from: "/sections/education/items/0" },
		] as const;
		expect(getAffectedSections(operations as never)).toEqual(new Set(["experience", "education"]));
	});
});

describe("getSectionValueFromResumeData", () => {
	it("returns top-level section values", () => {
		expect(getSectionValueFromResumeData(sampleData as never, "summary")).toEqual({ content: "Hello" });
	});

	it("returns nested section values", () => {
		expect(getSectionValueFromResumeData(sampleData as never, "skills")).toEqual(sampleData.sections.skills);
	});

	it("returns undefined when data is missing", () => {
		expect(getSectionValueFromResumeData(null, "summary")).toBeUndefined();
	});
});

describe("getSectionDiffs", () => {
	it("builds before/after entries for a section", () => {
		const operations = [{ op: "replace", path: "/summary/content", value: "Updated" }] as const;
		const diffs = getSectionDiffs(
			operations as never,
			sampleData as never,
			{ ...sampleData, summary: { content: "Updated" } } as never,
			"summary",
		);
		expect(diffs).toEqual([{ path: "/summary/content", before: "Hello", after: "Updated", op: "replace" }]);
	});

	it("handles remove operations", () => {
		const operations = [{ op: "remove", path: "/sections/skills/items/0" }] as const;
		const currentData = {
			...sampleData,
			sections: {
				...sampleData.sections,
				skills: { ...sampleData.sections.skills, items: [] },
			},
		};
		const diffs = getSectionDiffs(operations as never, sampleData as never, currentData as never, "skills");
		expect(diffs).toEqual([
			{ path: "/sections/skills/items/0", before: sampleData.sections.skills.items[0], after: undefined, op: "remove" },
		]);
	});
});

describe("getAffectedSectionFromPath for profiles and customSections", () => {
	it("detects /sections/profiles paths", () => {
		expect(getAffectedSectionFromPath("/sections/profiles/items/0/username")).toBe("profiles");
		expect(getAffectedSectionFromPath("/sections/profiles/title")).toBe("profiles");
	});

	it("detects /customSections paths", () => {
		expect(getAffectedSectionFromPath("/customSections/0/title")).toBe("custom");
		expect(getAffectedSectionFromPath("/customSections/0/items/0/content")).toBe("custom");
	});
});

describe("getSectionValueFromResumeData for profiles and custom", () => {
	it("returns sections.profiles for profiles", () => {
		expect(getSectionValueFromResumeData(defaultResumeData, "profiles")).toBe(defaultResumeData.sections.profiles);
	});

	it("returns customSections for custom", () => {
		expect(getSectionValueFromResumeData(defaultResumeData, "custom")).toBe(defaultResumeData.customSections);
	});
});

describe("getAffectedPreviewSectionIds for custom sections", () => {
	it("uses the id from an add operation when present", () => {
		const operations = [
			{ op: "add", path: "/customSections/-", value: { id: "custom-1", title: "Projects" } },
		] as const;
		const ids = getAffectedPreviewSectionIds(operations as never, defaultResumeData);
		expect(ids).toContain("custom-1");
	});

	it("returns the affected custom section id for an existing index", () => {
		const data = { ...defaultResumeData, customSections: [{ id: "cs-1" }, { id: "cs-2" }] } as never;
		const operations = [{ op: "replace", path: "/customSections/0/title", value: "Updated" }] as const;
		const ids = getAffectedPreviewSectionIds(operations as never, data);
		expect(ids).toContain("cs-1");
		expect(ids).not.toContain("cs-2");
	});

	it("falls back to all existing custom section ids when the index is out of range", () => {
		const data = { ...defaultResumeData, customSections: [{ id: "cs-1" }, { id: "cs-2" }] } as never;
		const operations = [{ op: "replace", path: "/customSections/9/title", value: "Updated" }] as const;
		const ids = getAffectedPreviewSectionIds(operations as never, data);
		expect(ids).toContain("cs-1");
		expect(ids).toContain("cs-2");
	});
});

describe("getSectionDiffs for profiles and custom", () => {
	it("diffs a profiles item change", () => {
		const snapshotData = structuredClone(defaultResumeData) as never;
		(snapshotData as typeof defaultResumeData).sections.profiles.items = [
			{ id: "p-1", username: "alice", network: "LinkedIn", icon: "linkedin" },
		] as never;
		const currentData = structuredClone(snapshotData) as never;
		(currentData as typeof defaultResumeData).sections.profiles.items[0].username = "alice2";
		const operations = [{ op: "replace", path: "/sections/profiles/items/0/username", value: "alice2" }] as const;
		const diffs = getSectionDiffs(operations as never, snapshotData, currentData, "profiles");
		expect(diffs).toEqual([
			{ path: "/sections/profiles/items/0/username", before: "alice", after: "alice2", op: "replace" },
		]);
	});

	it("diffs a custom section add", () => {
		const operations = [
			{ op: "add", path: "/customSections/-", value: { id: "cs-1", title: "Publications" } },
		] as const;
		const diffs = getSectionDiffs(operations as never, defaultResumeData, defaultResumeData, "custom");
		expect(diffs[0]).toMatchObject({
			path: "/customSections/-",
			before: undefined,
			op: "add",
		});
		expect((diffs[0] as never as { after: { id: string } }).after.id).toBe("cs-1");
	});
});

describe("aiChangedSectionClassName", () => {
	it("returns empty string when unchanged", () => {
		expect(aiChangedSectionClassName(false)).toBe("");
	});

	it("returns green highlight classes when changed", () => {
		expect(aiChangedSectionClassName(true)).toContain("border-green-500");
		expect(aiChangedSectionClassName(true)).toContain("bg-green-50/50");
	});
});

describe("getSectionOperations", () => {
	it("filters operations by left sidebar section", () => {
		const operations = [
			{ op: "replace", path: "/summary/content", value: "Updated" },
			{ op: "replace", path: "/sections/skills/items/0/keywords", value: ["TypeScript"] },
		] as const;
		const result = getSectionOperations(operations as never, "skills", sampleData as never, sampleData as never);
		expect(result).toHaveLength(1);
		expect(result[0].path).toBe("/sections/skills/items/0/keywords");
	});

	it("filters operations by custom section id", () => {
		const snapshotData = {
			...defaultResumeData,
			customSections: [{ id: "cs-1", title: "Projects", items: [] }],
		} as never;
		const currentData = structuredClone(snapshotData) as typeof defaultResumeData;
		currentData.customSections[0].title = "Open Source";
		const operations = [{ op: "replace", path: "/customSections/0/title", value: "Open Source" }] as const;
		const result = getSectionOperations(operations as never, "cs-1", currentData, snapshotData as never);
		expect(result).toHaveLength(1);
	});
});

describe("getSectionReviewGroups", () => {
	it("groups item-level changes for a section", () => {
		const snapshotData = structuredClone(defaultResumeData) as typeof defaultResumeData;
		snapshotData.sections.skills.items = [
			{
				id: "s-1",
				hidden: false,
				icon: "",
				iconColor: "",
				name: "Languages",
				proficiency: "Advanced",
				level: 4,
				keywords: ["TypeScript"],
			},
			{
				id: "s-2",
				hidden: false,
				icon: "",
				iconColor: "",
				name: "Frameworks",
				proficiency: "Advanced",
				level: 4,
				keywords: ["React"],
			},
		] as never;
		const currentData = structuredClone(snapshotData) as typeof defaultResumeData;
		currentData.sections.skills.items[0].keywords = ["TypeScript", "Node"];
		currentData.sections.skills.items[1].name = "Frontend";
		const operations = [
			{ op: "replace", path: "/sections/skills/items/0/keywords", value: ["TypeScript", "Node"] },
			{ op: "replace", path: "/sections/skills/items/1/name", value: "Frontend" },
		] as const;
		const groups = getSectionReviewGroups(operations as never, snapshotData, currentData, "skills");
		expect(groups).toHaveLength(2);
		expect(groups[0].title).toBe("Languages");
		expect(groups[0].fieldLabels).toContain("Keywords");
		expect(groups[1].title).toBe("Frontend");
		expect(groups[1].fieldLabels).toContain("Name");
	});

	it("ignores reverted changes", () => {
		const snapshotData = structuredClone(defaultResumeData) as typeof defaultResumeData;
		snapshotData.sections.experience.items = [
			{
				id: "e-1",
				hidden: false,
				company: "Acme",
				position: "Dev",
				location: "",
				period: "",
				website: { url: "", label: "", inlineLink: false },
				description: "Built things",
				roles: [],
			},
		] as never;
		const currentData = structuredClone(snapshotData) as typeof defaultResumeData;
		const operations = [{ op: "replace", path: "/sections/experience/items/0/description", value: "Updated" }] as const;
		const groups = getSectionReviewGroups(operations as never, snapshotData, currentData, "experience");
		expect(groups).toHaveLength(0);
	});
});

describe("buildSectionInversePatch", () => {
	it("builds inverse replace operations", () => {
		const snapshotData = structuredClone(defaultResumeData) as typeof defaultResumeData;
		snapshotData.sections.experience.items = [
			{
				id: "e-1",
				hidden: false,
				company: "Acme",
				position: "Dev",
				location: "",
				period: "",
				website: { url: "", label: "", inlineLink: false },
				description: "Before",
				roles: [],
			},
		] as never;
		const currentData = structuredClone(snapshotData) as typeof defaultResumeData;
		currentData.sections.experience.items[0].description = "After";
		const operations = [{ op: "replace", path: "/sections/experience/items/0/description", value: "After" }] as const;
		const inverse = buildSectionInversePatch(operations as never, "experience", currentData, snapshotData);
		expect(inverse).toEqual([{ op: "replace", path: "/sections/experience/items/0/description", value: "Before" }]);
	});

	it("builds inverse add operations", () => {
		const snapshotData = structuredClone(defaultResumeData) as typeof defaultResumeData;
		const currentData = structuredClone(defaultResumeData) as typeof defaultResumeData;
		currentData.sections.skills.items = [
			{
				id: "s-1",
				hidden: false,
				icon: "",
				iconColor: "",
				name: "Languages",
				proficiency: "Advanced",
				level: 4,
				keywords: ["Go"],
			},
		] as never;
		const operations = [
			{ op: "add", path: "/sections/skills/items/-", value: currentData.sections.skills.items[0] },
		] as const;
		const inverse = buildSectionInversePatch(operations as never, "skills", currentData, snapshotData);
		expect(inverse).toEqual([{ op: "remove", path: "/sections/skills/items/0" }]);
	});

	it("returns null when a value was manually edited", () => {
		const snapshotData = structuredClone(defaultResumeData) as typeof defaultResumeData;
		snapshotData.sections.skills.items = [
			{
				id: "s-1",
				hidden: false,
				icon: "",
				iconColor: "",
				name: "Languages",
				proficiency: "Advanced",
				level: 4,
				keywords: ["TypeScript"],
			},
		] as never;
		const currentData = structuredClone(snapshotData) as typeof defaultResumeData;
		currentData.sections.skills.items[0].keywords = ["Different"];
		const operations = [
			{ op: "replace", path: "/sections/skills/items/0/keywords", value: ["TypeScript", "React"] },
		] as const;
		const inverse = buildSectionInversePatch(operations as never, "skills", currentData, snapshotData);
		expect(inverse).toBeNull();
	});
});
