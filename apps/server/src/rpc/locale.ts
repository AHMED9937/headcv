import type { Locale } from "@headcv/utils/locale";
import { defaultLocale, isLocale } from "@headcv/utils/locale";
import { getCookie } from "../http/headers";

export function getRequestLocale(request: Request): Locale {
	const locale = getCookie(request, "locale");
	return isLocale(locale) ? locale : defaultLocale;
}
