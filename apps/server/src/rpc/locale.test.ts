import { describe, expect, it } from "vitest";
import { getRequestLocale } from "./locale";

const request = (headers: Record<string, string>) => new Request("http://localhost/api/rpc", { headers });

describe("getRequestLocale", () => {
	it("uses the language the user picked (locale cookie) first", () => {
		expect(getRequestLocale(request({ cookie: "locale=en-US", "accept-language": "ar-EG,ar;q=0.9" }))).toBe("en-US");
	});

	it("follows Accept-Language when no language was picked, mapping any Arabic variant to Arabic", () => {
		expect(getRequestLocale(request({ "accept-language": "ar-EG,ar;q=0.9,en;q=0.8" }))).toBe("ar-SA");
	});

	it("ranks languages by quality, not header order", () => {
		expect(getRequestLocale(request({ "accept-language": "en;q=0.5,ar-AE;q=0.9" }))).toBe("ar-SA");
	});

	it("ignores languages marked not acceptable (q=0)", () => {
		expect(getRequestLocale(request({ "accept-language": "ar;q=0,fr" }))).toBe("en-US");
	});

	it("ignores an invalid locale cookie", () => {
		expect(getRequestLocale(request({ cookie: "locale=xx-YY", "accept-language": "ar" }))).toBe("ar-SA");
	});

	it("falls back to English for unsupported or missing preferences", () => {
		expect(getRequestLocale(request({ "accept-language": "fr-FR,de;q=0.8" }))).toBe("en-US");
		expect(getRequestLocale(request({}))).toBe("en-US");
	});
});
