import { afterEach, describe, expect, it, vi } from "vitest";
import { supportedLocales } from "@headcv/utils/locale";
import { getLocale, getLocaleMessages, isLocale, resolveLocale, setLocaleCookie } from "./locale";

const cookies = vi.hoisted(() => ({ value: undefined as string | undefined, set: vi.fn() }));

vi.mock("js-cookie", () => ({ default: { get: () => cookies.value, set: cookies.set } }));

const stubBrowserLanguages = (languages: string[], language = languages[0] ?? "") =>
	vi.stubGlobal("navigator", { languages, language });

afterEach(() => {
	cookies.value = undefined;
	cookies.set.mockClear();
	vi.unstubAllGlobals();
});

describe("getLocale", () => {
	it("defaults to Arabic for any Arabic browser or device language", () => {
		stubBrowserLanguages(["ar-EG", "en-US"]);
		expect(getLocale()).toBe("ar-SA");
	});

	it("defaults to English when no browser language is supported", () => {
		stubBrowserLanguages(["fr-FR", "de-DE"]);
		expect(getLocale()).toBe("en-US");
	});

	it("keeps the language the user picked over the browser language", () => {
		cookies.value = "en-US";
		stubBrowserLanguages(["ar-SA"]);
		expect(getLocale()).toBe("en-US");
	});

	it("falls back to navigator.language when the preference list is empty", () => {
		stubBrowserLanguages([], "ar");
		expect(getLocale()).toBe("ar-SA");
	});
});

describe("setLocaleCookie", () => {
	it("remembers the picked language across browser sessions", () => {
		setLocaleCookie("ar-SA");
		expect(cookies.set).toHaveBeenCalledWith("locale", "ar-SA", expect.objectContaining({ expires: 365 }));
	});
});

describe("supported locales", () => {
	it.each(supportedLocales)("ships a message catalog for %s", async (locale) => {
		await expect(getLocaleMessages(locale)).resolves.toMatchObject({ locale });
	});
});

describe("isLocale", () => {
	it("returns true for known locale en-US", () => {
		expect(isLocale("en-US")).toBe(true);
	});

	it("returns true for de-DE", () => {
		expect(isLocale("de-DE")).toBe(true);
	});

	it("returns true for zh-CN", () => {
		expect(isLocale("zh-CN")).toBe(true);
	});

	it("returns false for unknown locale", () => {
		expect(isLocale("xx-YY")).toBe(false);
	});

	it("returns false for empty string", () => {
		expect(isLocale("")).toBe(false);
	});

	it("returns false for malformed locale", () => {
		expect(isLocale("not a locale")).toBe(false);
	});

	it("is case-sensitive", () => {
		expect(isLocale("en-us")).toBe(false);
	});
});

describe("resolveLocale", () => {
	it("returns the locale unchanged when valid", () => {
		expect(resolveLocale("fr-FR")).toBe("fr-FR");
	});

	it("returns en-US default for invalid locale", () => {
		expect(resolveLocale("xx-YY")).toBe("en-US");
	});

	it("returns en-US default for empty string", () => {
		expect(resolveLocale("")).toBe("en-US");
	});
});
