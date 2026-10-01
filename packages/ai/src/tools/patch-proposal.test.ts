import { describe, expect, it } from "vitest";
import { sampleResumeData } from "@headcv/schema/resume/sample";
import {
	buildResumePatchProposalPreview,
	normalizeResumePatchOperationPaths,
	normalizeResumePatchProposals,
	resumePatchProposalSchema,
	resumePatchProposalToolInputSchema,
	resumePatchProposalToolOutputSchema,
} from "./patch-proposal";

describe("resume patch proposals", () => {
	it("requires at least one operation per proposal", () => {
		const result = resumePatchProposalSchema.safeParse({
			id: "proposal-1",
			title: "Empty proposal",
			operations: [],
		});

		expect(result.success).toBe(false);
	});

	it("normalizes tool input without requiring model-generated ids", () => {
		const result = resumePatchProposalToolInputSchema.safeParse({
			proposals: [
				{
					title: "Rewrite summary",
					summary: "Make the summary more direct.",
					operations: [{ op: "replace", path: "/summary/content", value: "<p>Focused product engineer.</p>" }],
				},
			],
		});

		expect(result.success).toBe(true);
	});

	it("normalizes base versions as JSON-safe ISO timestamps", () => {
		const proposals = normalizeResumePatchProposals(
			{
				proposals: [
					{
						title: "Rewrite summary",
						operations: [{ op: "replace", path: "/summary/content", value: "<p>Focused product engineer.</p>" }],
					},
				],
			},
			new Date("2026-05-10T06:38:27.093Z"),
		);

		const result = resumePatchProposalToolOutputSchema.parse({ proposals });

		expect(result.proposals[0]?.baseUpdatedAt).toBe("2026-05-10T06:38:27.093Z");
	});

	it("builds readable before/after preview entries", () => {
		const proposal = resumePatchProposalSchema.parse({
			id: "proposal-1",
			title: "Rewrite summary",
			operations: [{ op: "replace", path: "/summary/content", value: "<p>Focused product engineer.</p>" }],
		});

		const preview = buildResumePatchProposalPreview(sampleResumeData, proposal);

		expect(preview.title).toBe("Rewrite summary");
		expect(preview.entries).toHaveLength(1);
		expect(preview.entries[0]).toMatchObject({
			operation: "replace",
			path: "/summary/content",
			label: "Summary content",
			after: "<p>Focused product engineer.</p>",
		});
		expect(preview.entries[0]?.before).toBe(sampleResumeData.summary.content);
	});

	it("normalizes top-level section family paths to /sections/...", () => {
		const operations = normalizeResumePatchOperationPaths([
			{ op: "replace", path: "/summary/content", value: "x" },
			{ op: "replace", path: "/skills/items/0/keywords", value: ["a"] },
			{ op: "add", path: "/projects/items/0/roles/-", value: "Lead" },
			{ op: "replace", path: "/sections/education/items/0/school", value: "MIT" },
			{ op: "replace", path: "/basics/name", value: "Jane" },
			{ op: "move", path: "/experience/items/0", from: "/experience/items/1" },
		]);

		expect(operations[0]?.path).toBe("/summary/content");
		expect(operations[1]?.path).toBe("/sections/skills/items/0/keywords");
		expect(operations[2]?.path).toBe("/sections/projects/items/0/roles/-");
		expect(operations[3]?.path).toBe("/sections/education/items/0/school");
		expect(operations[4]?.path).toBe("/basics/name");
		expect(operations[5]?.path).toBe("/sections/experience/items/0");
		expect((operations[5] as { from: string }).from).toBe("/sections/experience/items/1");
	});

	it("normalizes proposals with legacy section paths", () => {
		const proposals = normalizeResumePatchProposals({
			proposals: [
				{
					title: "Fix paths",
					operations: [{ op: "replace", path: "/skills/items/0/keywords", value: ["TypeScript"] }],
				},
			],
		});

		expect(proposals[0]?.operations[0]?.path).toBe("/sections/skills/items/0/keywords");
	});

	it("shows appended Personal Details links in the after preview", () => {
		const profile = {
			id: "b2c7f28a-3df7-4b8b-a8a1-8f95a8f522e8",
			icon: "instagram-logo",
			text: "dkowalski.games",
			link: "https://instagram.com/dkowalski.games",
		};
		const proposal = resumePatchProposalSchema.parse({
			id: "proposal-1",
			title: "Add social profile",
			operations: [{ op: "add", path: "/basics/customFields/-", value: profile }],
		});

		const preview = buildResumePatchProposalPreview(sampleResumeData, proposal);

		expect(preview.entries[0]).toMatchObject({
			operation: "add",
			path: "/basics/customFields/-",
			label: "Basics new item",
			before: undefined,
			after: profile,
		});
	});
});
