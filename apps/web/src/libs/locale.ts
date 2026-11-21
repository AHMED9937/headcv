import type { Locale, SupportedLocale } from "@headcv/utils/locale";
import type { MessageDescriptor, Messages } from "@lingui/core";
import { i18n } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import Cookies from "js-cookie";
import { defaultLocale, isRTL, localeSchema, negotiateLocale } from "@headcv/utils/locale";

export { isRTL };

const storageKey = "locale";
const messageLoaders = import.meta.glob<{ messages: Messages }>(["../../locales/ar-SA.po", "../../locales/en-US.po"]);

// Keyed by SupportedLocale, so a language added to supportedLocales can't ship without a switcher entry.
export const localeMap = {
	"ar-SA": msg`Arabic`,
	"en-US": msg`English`,
} satisfies Record<SupportedLocale, MessageDescriptor>;

export function isLocale(locale: string): locale is Locale {
	return localeSchema.safeParse(locale).success;
}

export const resolveLocale = (locale: string): Locale => {
	return isLocale(locale) ? locale : defaultLocale;
};

/** The language the user picked (cookie) wins; otherwise the browser/device language list decides. */
export const getLocale = (): Locale => {
	const locale = Cookies.get(storageKey);
	if (locale && isLocale(locale)) return locale;

	// navigator.languages is the browser/device preference list, the same one sent as Accept-Language.
	return negotiateLocale(navigator.languages.length > 0 ? navigator.languages : [navigator.language]);
};

// Only an explicit pick is stored (for a year); a detected language is re-detected on every visit.
export const setLocaleCookie = (locale: Locale) => {
	Cookies.set(storageKey, locale, { expires: 365, sameSite: "lax" });
};

const loadMessages = async (locale: Locale) => {
	const load = messageLoaders[`../../locales/${locale}.po`];

	if (!load) throw new Error(`Unknown locale: ${locale}`);

	const { messages } = await load();
	return messages;
};

export const getLocaleMessages = async (locale: string) => {
	const resolvedLocale = resolveLocale(locale);
	let messages: Messages;

	try {
		messages = await loadMessages(resolvedLocale);
		return { locale: resolvedLocale, messages };
	} catch {
		messages = await loadMessages(defaultLocale);
		return { locale: defaultLocale, messages };
	}
};

export const loadLocale = async (locale: string) => {
	const { locale: resolvedLocale, messages } = await getLocaleMessages(locale);
	i18n.loadAndActivate({ locale: resolvedLocale, messages });
};
