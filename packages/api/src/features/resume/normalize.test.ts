import { describe, expect, it } from "vitest";
import { resumeDataSchema } from "@headcv/schema/resume/data";
import { defaultResumeData } from "@headcv/schema/resume/default";
import { normalizeResumeData } from "./normalize";

describe("normalizeResumeData", () => {
	it("normalizes a partial experience item into valid ResumeData", () => {
		const result = normalizeResumeData({
			sections: { experience: { items: [{ position: "Engineer", description: "Built systems" }] } },
		});
		const item = result.data.sections.experience.items[0];
		expect(item).toBeDefined();
		expect(item?.id).toBeTruthy();
		expect(item?.hidden).toBe(false);
		expect(() => resumeDataSchema.parse(result.data)).not.toThrow();
	});

	it("filters a completely empty experience item", () => {
		const { data } = normalizeResumeData({
			sections: { experience: { items: [{ company: "", position: "", description: "" }] } },
		});
		expect(data.sections.experience.items).toEqual([]);
	});

	it("migrates legacy experience periods to structured dates", () => {
		const { data } = normalizeResumeData({
			sections: {
				experience: {
					items: [
						{
							company: "Acme",
							period: "March 2022 - Present",
							roles: [{ position: "Lead", period: "05/2023 \u2013 06/2024" }],
						},
					],
				},
			},
		});
		const item = data.sections.experience.items[0];
		expect(item).toMatchObject({ startDate: "2022-03", endDate: "" });
		expect(item?.roles[0]).toMatchObject({ startDate: "2023-05", endDate: "2024-06" });
	});

	it("preserves Arabic text", () => {
		const { data } = normalizeResumeData({
			basics: { name: "محمد أحمد" },
			sections: { education: { items: [{ school: "جامعة القاهرة", degree: "بكالوريوس" }] } },
		});
		expect(data.basics.name).toBe("محمد أحمد");
		expect(data.sections.education.items[0]?.school).toBe("جامعة القاهرة");
	});

	it("removes extra fields", () => {
		const { data } = normalizeResumeData({ unexpected: "removed", basics: { name: "Jane", secret: "removed" } });
		expect(data).not.toHaveProperty("unexpected");
		expect(data.basics).not.toHaveProperty("secret");
	});

	it("uses application defaults for picture and metadata", () => {
		const { data } = normalizeResumeData({
			picture: { url: "https://untrusted.example/picture.jpg" },
			metadata: { notes: "untrusted" },
		});
		expect(data.picture).toEqual(defaultResumeData.picture);
		expect(data.metadata).toEqual(defaultResumeData.metadata);
	});

	it("returns warnings for defaulted fields", () => {
		const { warnings } = normalizeResumeData({
			sections: { experience: { items: [{ position: "Engineer" }] } },
		});
		expect(warnings).toContain('experience[0].company was missing; defaulted to ""');
		expect(warnings).toContain("experience[0].hidden was missing; defaulted to false");
	});

	it("migrates legacy profiles into Personal Details with inferred icons", () => {
		const { data } = normalizeResumeData({
			sections: {
				profiles: {
					items: [
						{
							network: "LinkedIn",
							username: "jane-doe",
							website: { url: "https://linkedin.com/in/jane-doe" },
						},
					],
				},
			},
		});

		expect(data.basics.customFields).toEqual([
			expect.objectContaining({
				icon: "linkedin-logo",
				text: "jane-doe",
				link: "https://linkedin.com/in/jane-doe",
			}),
		]);
		expect(data.sections).not.toHaveProperty("profiles");
	});

	it("deduplicates legacy profiles already present in Personal Details", () => {
		const input = {
			basics: {
				customFields: [
					{ id: "linkedin", icon: "linkedin-logo", text: "jane-doe", link: "https://linkedin.com/in/jane-doe" },
				],
			},
			sections: {
				profiles: {
					items: [
						{
							network: "LinkedIn",
							username: "jane-doe",
							website: { url: "https://linkedin.com/in/jane-doe/" },
						},
					],
				},
			},
		};

		const first = normalizeResumeData(input).data;
		const second = normalizeResumeData(first).data;
		expect(first.basics.customFields).toHaveLength(1);
		expect(second.basics.customFields).toEqual(first.basics.customFields);
	});
});
