import type { FeatureFlags } from "@headcv/api/features/flags";
import type { AuthSession } from "@headcv/auth/types";
import type { Locale } from "@headcv/utils/locale";
import type { IconProps } from "@phosphor-icons/react";
import type { QueryClient } from "@tanstack/react-query";
import type { orpc } from "@/libs/orpc/client";
import type { Theme } from "@/libs/theme";
import { i18n } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import { I18nProvider } from "@lingui/react";
import { IconContext } from "@phosphor-icons/react";
import { HotkeysProvider } from "@tanstack/react-hotkeys";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Outlet } from "@tanstack/react-router";
import { domAnimation, LazyMotion, MotionConfig } from "motion/react";
import { useEffect, useMemo } from "react";
import { DirectionProvider } from "@headcv/ui/components/direction";
import { Toaster } from "@headcv/ui/components/sonner";
import { TooltipProvider } from "@headcv/ui/components/tooltip";
import { DonationToast } from "@/components/ui/donation-toast";
import { DialogManager } from "@/dialogs/manager";
import { CommandPalette } from "@/features/command-palette";
import { ThemeProvider } from "@/features/theme/provider";
import { ConfirmDialogProvider } from "@/hooks/use-confirm";
import { PromptDialogProvider } from "@/hooks/use-prompt";
import { getSession } from "@/libs/auth/session";
import { getLocale, isRTL, loadLocale } from "@/libs/locale";
import { client } from "@/libs/orpc/client";
import { getTheme } from "@/libs/theme";

type RouterContext = {
	theme: Theme;
	locale: Locale;
	orpc: typeof orpc;
	queryClient: QueryClient;
	session: AuthSession | null;
	flags: FeatureFlags;
};

const appName = msg`HeadCV`;
const tagline = msg`Build a Professional CV in Minutes`;
const description = msg`HeadCV is a guided CV builder that helps you create an ATS-friendly resume in minutes. Free to start; no credit card required.`;
const ogImageAlt = msg`HeadCV — Build a professional ATS-friendly CV in minutes with AI assistance and live preview.`;

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootComponent,
	head: () => {
		const title = `${i18n._(appName)} | ${i18n._(tagline)}`;
		const appUrl = typeof window !== "undefined" ? window.location.origin : "https://headcv.com";

		return {
			links: [
				// Icons
				{ rel: "icon", href: "/favicon.ico", type: "image/x-icon", sizes: "128x128" },
				{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml", sizes: "256x256 any" },
				{ rel: "apple-touch-icon", href: "/apple-touch-icon-180x180.png", type: "image/png", sizes: "180x180 any" },
				// Manifest
				{ rel: "manifest", href: "/manifest.webmanifest", crossOrigin: "use-credentials" },
			],
			meta: [
				{ title },
				{ charSet: "UTF-8" },
				{ name: "description", content: i18n._(description) },
				{ name: "viewport", content: "width=device-width, initial-scale=1" },
				// Meta Tags
				{ name: "theme-color", content: "#1e3a5f" },
				{ name: "application-name", content: i18n._(appName) },
				{ name: "mobile-web-app-capable", content: "yes" },
				{ name: "apple-mobile-web-app-capable", content: "yes" },
				{ name: "apple-mobile-web-app-title", content: i18n._(appName) },
				{ name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
				// Twitter Tags
				{ property: "twitter:card", content: "summary_large_image" },
				{ property: "twitter:title", content: title },
				{ property: "twitter:description", content: i18n._(description) },
				{ property: "twitter:image", content: `${appUrl}/opengraph/banner.jpg` },
				{ name: "twitter:image:alt", content: i18n._(ogImageAlt) },
				// OpenGraph Tags
				{ property: "og:type", content: "website" },
				{ property: "og:site_name", content: i18n._(appName) },
				{ property: "og:title", content: title },
				{ property: "og:description", content: i18n._(description) },
				{ property: "og:url", content: appUrl },
				{ property: "og:image", content: `${appUrl}/opengraph/banner.jpg` },
				{ property: "og:image:width", content: "1200" },
				{ property: "og:image:height", content: "630" },
				{ property: "og:image:alt", content: i18n._(ogImageAlt) },
			],
		};
	},
	beforeLoad: async () => {
		const [theme, locale, session, flags] = await Promise.all([
			getTheme(),
			getLocale(),
			getSession(),
			client.flags.get().catch(() => ({ disableSignups: false, disableEmailAuth: false })),
		]);

		await loadLocale(locale);

		return { theme, locale, session, flags };
	},
});

function RootComponent() {
	const { theme, locale, queryClient } = Route.useRouteContext();
	const dir = isRTL(locale) ? "rtl" : "ltr";

	const iconContextValue = useMemo<IconProps>(() => ({ size: 16, weight: "regular" }), []);

	useEffect(() => {
		document.documentElement.lang = locale;
		document.documentElement.dir = dir;
		document.documentElement.classList.toggle("dark", theme === "dark");
	}, [dir, locale, theme]);

	return (
		<>
			<HeadContent />

			<QueryClientProvider client={queryClient}>
				<MotionConfig reducedMotion="user">
					<LazyMotion features={domAnimation}>
						<I18nProvider i18n={i18n}>
							<IconContext.Provider value={iconContextValue}>
								<ThemeProvider theme={theme}>
									<HotkeysProvider>
										<DirectionProvider direction={dir}>
											<TooltipProvider>
												<ConfirmDialogProvider>
													<PromptDialogProvider>
														<Outlet />

														<DonationToast />
														<DialogManager />
														<CommandPalette />
														<Toaster richColors position="bottom-right" />
													</PromptDialogProvider>
												</ConfirmDialogProvider>
											</TooltipProvider>
										</DirectionProvider>
									</HotkeysProvider>
								</ThemeProvider>
							</IconContext.Provider>
						</I18nProvider>
					</LazyMotion>
				</MotionConfig>
			</QueryClientProvider>
		</>
	);
}
