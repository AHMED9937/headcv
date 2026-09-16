import { describe, expect, it } from "vitest";
import { defaultResumeData } from "@headcv/schema/resume/default";
import { normalizeResumeData } from "./normalize";

describe("normalizeResumeData", () => {
	it("upgrades legacy typography and enforces the default locale", () => {
		const data = structuredClone(defaultResumeData);
		data.metadata.typography = {
			body: { fontFamily: "IBM Plex Serif", fontWeights: ["400", "500"], fontSize: 10, lineHeight: 1.5 },
			heading: { fontFamily: "IBM Plex Serif", fontWeights: ["600"], fontSize: 14, lineHeight: 1.5 },
		};
		const result = normalizeResumeData(data);
		expect(result.metadata.page.locale).toBe("en-US");
		expect(result.metadata.typography.body.fontFamily).not.toBe("IBM Plex Serif");
	});
});
