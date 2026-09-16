import { describe, expect, it } from "vitest";
import { defaultResumeData } from "@headcv/schema/resume/default";
import { enforceResumeLocale, RESUME_LOCALE } from "./locale";

describe("enforceResumeLocale", () => {
	it("forces the resume locale to English", () => {
		const data = structuredClone(defaultResumeData);
		data.metadata.page.locale = "ar-SA";

		expect(enforceResumeLocale(data).metadata.page.locale).toBe(RESUME_LOCALE);
	});

	it("does not mutate the input", () => {
		const data = structuredClone(defaultResumeData);
		data.metadata.page.locale = "ar-SA";

		enforceResumeLocale(data);

		expect(data.metadata.page.locale).toBe("ar-SA");
	});
});
