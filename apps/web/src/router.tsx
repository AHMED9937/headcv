import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { createRouter } from "@tanstack/react-router";
import { ErrorScreen } from "./components/layout/error-screen";
import { LoadingScreen } from "./components/layout/loading-screen";
import { NotFoundScreen } from "./components/layout/not-found-screen";
import { orpc } from "./libs/orpc/client";
import { getQueryClient } from "./libs/query/client";
import { clearRootContextCache, loadRootContext } from "./libs/root-context";
import { routeTree } from "./routeTree.gen";

export const getRouter = async () => {
	const queryClient = getQueryClient();

	// Also warms the cache the root route's beforeLoad reads, so the first render doesn't refetch.
	const rootContext = await loadRootContext(queryClient);

	const router = createRouter({
		routeTree,
		scrollRestoration: true,
		defaultViewTransition: true,
		defaultStructuralSharing: true,
		// Start fetching a route's code and data on link hover/focus, so the click feels instant.
		defaultPreload: "intent",
		defaultErrorComponent: ErrorScreen,
		defaultPendingComponent: LoadingScreen,
		defaultNotFoundComponent: NotFoundScreen,
		// The router renders pending/error screens outside the root component while the root
		// route loads (e.g. a cold load after the Dodo checkout redirect). They use <Trans>, so
		// they must sit inside the i18n provider too, or the page crashes to a blank screen.
		Wrap: ({ children }) => <I18nProvider i18n={i18n}>{children}</I18nProvider>,
		context: { orpc, queryClient, ...rootContext },
	});

	// Sign-in/out and profile changes call router.invalidate(); drop the cached session and
	// flags first so the re-run beforeLoad sees the new state.
	const invalidate = router.invalidate.bind(router);
	router.invalidate = (options) => {
		clearRootContextCache(queryClient);
		return invalidate(options);
	};

	return router;
};
