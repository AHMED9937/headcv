import type { Locale } from "@headcv/utils/locale";
import { parseAccept } from "hono/utils/accept";
import { isLocale, negotiateLocale } from "@headcv/utils/locale";
import { getCookie } from "../http/headers";

/** Same order as the web app: the language the user picked (cookie), then the browser's Accept-Language. */
export function getRequestLocale(request: Request): Locale {
	const locale = getCookie(request, "locale");
	if (isLocale(locale)) return locale;

	// parseAccept sorts by quality; q=0 means "not acceptable" (RFC 9110), so it is dropped.
	const accepted = parseAccept(request.headers.get("accept-language") ?? "")
		.filter(({ q }) => q > 0)
		.map(({ type }) => type);

	return negotiateLocale(accepted);
}
