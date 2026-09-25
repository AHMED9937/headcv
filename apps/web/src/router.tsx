import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { createRouter } from "@tanstack/react-router";
import { ErrorScreen } from "./components/layout/error-screen";
import { LoadingScreen } from "./components/layout/loading-screen";
import { NotFoundScreen } from "./components/layout/not-found-screen";
import { getSession } from "./libs/auth/session";
import { getLocale, loadLocale } from "./libs/locale";
import { client, orpc } from "./libs/orpc/client";
import { getQueryClient } from "./libs/query/client";
import { getTheme } from "./libs/theme";
import { routeTree } from "./routeTree.gen";

export const getRouter = async () => {
	const queryClient = getQueryClient();

	const [theme, locale, session, flags] = await Promise.all([
		getTheme(),
		getLocale(),
		getSession(),
		client.flags.get().catch(() => ({ disableSignups: false, disableEmailAuth: false })),
	]);

	await loadLocale(locale);

	const router = createRouter({
		routeTree,
		scrollRestoration: true,
		defaultViewTransition: true,
		defaultStructuralSharing: true,
		defaultErrorComponent: ErrorScreen,
		defaultPendingComponent: LoadingScreen,
		defaultNotFoundComponent: NotFoundScreen,
		// The router renders pending/error screens outside the root component while the root
		// route loads (e.g. a cold load after the Dodo checkout redirect). They use <Trans>, so
		// they must sit inside the i18n provider too, or the page crashes to a blank screen.
		Wrap: ({ children }) => <I18nProvider i18n={i18n}>{children}</I18nProvider>,
		context: { orpc, queryClient, theme, locale, session, flags },
	});

	return router;
};
