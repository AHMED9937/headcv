import type { QueryClient } from "@tanstack/react-query";
import { i18n } from "@lingui/core";
import { getSession } from "./auth/session";
import { getLocale, loadLocale } from "./locale";
import { client } from "./orpc/client";
import { getTheme } from "./theme";

/**
 * Session and feature flags back the root route, whose beforeLoad runs on every navigation.
 * Caching them briefly turns page changes from two network round trips into none.
 * Anything that changes the session calls router.invalidate(), which clears this cache.
 */
const ROOT_CONTEXT_STALE_MS = 60_000;
const ROOT_CONTEXT_KEY = ["root-context"] as const;

const defaultFlags = { disableSignups: false, disableEmailAuth: false };

export async function loadRootContext(queryClient: QueryClient) {
	const theme = getTheme();
	const locale = getLocale();

	const [session, flags] = await Promise.all([
		queryClient.fetchQuery({
			queryKey: [...ROOT_CONTEXT_KEY, "session"],
			queryFn: getSession,
			staleTime: ROOT_CONTEXT_STALE_MS,
		}),
		queryClient.fetchQuery({
			queryKey: [...ROOT_CONTEXT_KEY, "flags"],
			queryFn: () => client.flags.get().catch(() => defaultFlags),
			staleTime: ROOT_CONTEXT_STALE_MS,
		}),
		// Catalogs are only (re)loaded when the language actually changes.
		i18n.locale === locale ? undefined : loadLocale(locale),
	]);

	return { theme, locale, session, flags };
}

export function clearRootContextCache(queryClient: QueryClient) {
	queryClient.removeQueries({ queryKey: ROOT_CONTEXT_KEY });
}
