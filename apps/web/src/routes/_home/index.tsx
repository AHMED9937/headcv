import { i18n } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import { createFileRoute } from "@tanstack/react-router";
import { createRootStructuredDataScript, getCanonicalRootUrl } from "@/libs/seo";
import { CounterBar } from "./-sections/counter-bar";
import { FAQ } from "./-sections/faq";
import { Features } from "./-sections/features";
import { FinalCta } from "./-sections/final-cta";
import { Footer } from "./-sections/footer";
import { Hero } from "./-sections/hero";
import { LandingReveal } from "./-sections/landing-reveal";
import { Pricing } from "./-sections/pricing";
import { TemplatesShowcase } from "./-sections/templates-showcase";
import { Tools } from "./-sections/tools";

const landingTitle = msg({
	id: "home.seo.title",
	message: "Free Resume Builder | Create ATS-Friendly CVs Online | HeadCV",
});

const landingDescription = msg({
	id: "home.seo.description",
	message:
		"Create a professional, ATS-friendly resume for free with HeadCV. Choose a template, customize your design, and download your CV as a PDF. No credit card required.",
});

export const Route = createFileRoute("/_home/")({
	component: RouteComponent,
	head: () => {
		const appUrl = "https://headcv.com";
		const canonicalUrl = getCanonicalRootUrl(appUrl);
		const title = i18n._(landingTitle);
		const description = i18n._(landingDescription);
		const ogImage = `${appUrl}/opengraph/banner.jpg`;
		const ogLocale = i18n.locale === "ar" ? "ar_SA" : "en_US";

		return {
			title,
			links: [{ rel: "canonical", href: canonicalUrl }],
			meta: [
				{ name: "description", content: description },
				{ name: "robots", content: "index, follow" },
				{ property: "og:title", content: title },
				{ property: "og:description", content: description },
				{ property: "og:type", content: "website" },
				{ property: "og:url", content: canonicalUrl },
				{ property: "og:image", content: ogImage },
				{ property: "og:site_name", content: "HeadCV" },
				{ property: "og:locale", content: ogLocale },
				{ property: "twitter:title", content: title },
				{ property: "twitter:description", content: description },
				{ property: "twitter:image", content: ogImage },
				{ property: "twitter:card", content: "summary_large_image" },
			],
			scripts: [createRootStructuredDataScript(canonicalUrl, i18n.locale)],
		};
	},
});

function RouteComponent() {
	return (
		<>
			<main id="main-content" tabIndex={-1} className="relative outline-none">
				<Hero />
				<CounterBar />
				<LandingReveal>
					<Tools />
				</LandingReveal>
				<LandingReveal>
					<TemplatesShowcase />
				</LandingReveal>
				<LandingReveal>
					<Features />
				</LandingReveal>
				<LandingReveal>
					<Pricing />
				</LandingReveal>
				<LandingReveal>
					<FAQ />
				</LandingReveal>
				<LandingReveal>
					<FinalCta />
				</LandingReveal>
			</main>
			<Footer />
		</>
	);
}
