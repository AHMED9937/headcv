import z from "zod";

export const localeSchema = z.union([
	z.literal("af-ZA"),
	z.literal("am-ET"),
	z.literal("ar-SA"),
	z.literal("az-AZ"),
	z.literal("bg-BG"),
	z.literal("bn-BD"),
	z.literal("ca-ES"),
	z.literal("cs-CZ"),
	z.literal("da-DK"),
	z.literal("de-DE"),
	z.literal("el-GR"),
	z.literal("en-US"),
	z.literal("en-GB"),
	z.literal("es-ES"),
	z.literal("fa-IR"),
	z.literal("fi-FI"),
	z.literal("fr-FR"),
	z.literal("he-IL"),
	z.literal("hi-IN"),
	z.literal("hu-HU"),
	z.literal("id-ID"),
	z.literal("it-IT"),
	z.literal("ja-JP"),
	z.literal("km-KH"),
	z.literal("kn-IN"),
	z.literal("ko-KR"),
	z.literal("lt-LT"),
	z.literal("lv-LV"),
	z.literal("ml-IN"),
	z.literal("mr-IN"),
	z.literal("ms-MY"),
	z.literal("ne-NP"),
	z.literal("nl-NL"),
	z.literal("no-NO"),
	z.literal("or-IN"),
	z.literal("pl-PL"),
	z.literal("pt-BR"),
	z.literal("pt-PT"),
	z.literal("ro-RO"),
	z.literal("ru-RU"),
	z.literal("sk-SK"),
	z.literal("sl-SI"),
	z.literal("sq-AL"),
	z.literal("sr-SP"),
	z.literal("sv-SE"),
	z.literal("ta-IN"),
	z.literal("te-IN"),
	z.literal("th-TH"),
	z.literal("tr-TR"),
	z.literal("uk-UA"),
	z.literal("uz-UZ"),
	z.literal("vi-VN"),
	z.literal("zh-CN"),
	z.literal("zh-TW"),
	z.literal("zu-ZA"),
]);

export type Locale = z.infer<typeof localeSchema>;

/**
 * Locales the web UI ships translations for; automatic detection only ever picks one of these.
 * To add a language, list it here, in the web app's `localeMap` (type-checked) and in its catalog loader.
 */
export const supportedLocales = ["en-US", "ar-SA"] as const satisfies readonly Locale[];

export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = "en-US";

/** Base language of a BCP 47 tag, e.g. "ar-EG" → "ar". Also accepts "_" separators ("ar_EG"). */
const getLanguage = (tag: string) => tag.trim().split(/[-_]/)[0]?.toLowerCase() ?? "";

/**
 * Picks the UI locale from a visitor's ordered language preferences: `navigator.languages` in the
 * browser, or the q-sorted `Accept-Language` header on the server. The first preference we support
 * wins, matched exactly or else by base language (ar, ar-EG and ar-MA all give ar-SA).
 * If none is supported, the default locale is used.
 */
export function negotiateLocale(preferred: readonly string[]): SupportedLocale {
	for (const tag of preferred) {
		const normalized = tag.trim().replaceAll("_", "-").toLowerCase();
		const match =
			supportedLocales.find((locale) => locale.toLowerCase() === normalized) ??
			supportedLocales.find((locale) => getLanguage(locale) === getLanguage(normalized));

		if (match) return match;
	}

	return defaultLocale;
}

export function isLocale(value: unknown): value is Locale {
	return localeSchema.safeParse(value).success;
}

export function isCJKLocale(locale: Locale): boolean {
	return locale === "zh-CN" || locale === "zh-TW" || locale === "ja-JP" || locale === "ko-KR";
}

const RTL_LANGUAGES = new Set([
	"ar", // Arabic
	"ckb", // Kurdish (Sorani)
	"dv", // Dhivehi
	"fa", // Persian
	"he", // Hebrew
	"ps", // Pashto
	"sd", // Sindhi
	"ug", // Uyghur
	"ur", // Urdu
	"yi", // Yiddish
]);

export function isRTL(locale: string): boolean {
	return RTL_LANGUAGES.has(getLanguage(locale));
}
