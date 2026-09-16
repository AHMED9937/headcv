import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { ArrowRightIcon, FileTextIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Button } from "@headcv/ui/components/button";
import { LandingIcon } from "./landing-icon";

export function Hero() {
	return (
		<section
			id="hero"
			aria-labelledby="hero-heading"
			className="overflow-hidden px-4 pt-28 pb-16 sm:px-6 sm:pt-32 sm:pb-24 lg:px-8"
		>
			<div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
				<div className="max-w-2xl text-start">
					{/* Badge */}
					<p className="mb-4 font-semibold text-primary text-xs uppercase tracking-widest rtl:tracking-normal">
						<Trans id="home.hero.eyebrow">Free online resume builder</Trans>
					</p>
					{/* Headline */}
					<h1
						id="hero-heading"
						className="font-bold font-display text-4xl text-primary leading-tight tracking-tight sm:text-5xl lg:text-6xl rtl:leading-relaxed rtl:tracking-normal"
					>
						<Trans id="home.hero.title">Build a job-winning resume for free</Trans>
					</h1>
					{/* Description */}
					<p className="mt-6 max-w-lg text-lg text-muted-foreground leading-relaxed">
						<Trans id="home.hero.description">
							Your next chapter starts with a great resume. Choose a template, tell your story, and download a polished
							PDF. No credit card required.
						</Trans>
					</p>
					{/* CTA Buttons */}
					<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
						<Button
							nativeButton={false}
							className="h-auto min-h-12 gap-2 whitespace-normal px-7 py-3 font-semibold text-base"
							render={<Link to="/templates" search={{}} />}
						>
							<Trans id="home.create">Create my CV</Trans>
							<ArrowRightIcon aria-hidden="true" className="rtl-flip size-5" />
						</Button>
						<Button
							nativeButton={false}
							variant="outline"
							className="h-auto min-h-12 whitespace-normal bg-card px-7 py-3 text-base"
							render={<a href="#templates">{t({ id: "home.browse", message: "Browse templates" })}</a>}
						>
							<Trans id="home.browse">Browse templates</Trans>
						</Button>
					</div>
				</div>
				<div className="relative mx-auto w-full max-w-[380px] pb-5">
					<Link
						to="/templates"
						search={{ template: "chikorita" }}
						aria-label={t({
							id: "home.hero.fullPreview",
							message: "Choose the Chikorita resume template",
						})}
						className="block cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
					>
						<img
							src="/templates/chikorita-hero-vector.svg"
							alt={t({ id: "home.hero.preview", message: "Resume preview with HeadCV navy accents" })}
							width={1055}
							height={1491}
							fetchPriority="high"
							className="h-auto w-full rounded-xl border bg-white shadow-xl"
						/>
					</Link>
					{/* Scroll indicator - decorative */}
					<div className="absolute inset-e-2 bottom-0 flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-primary shadow-md">
						<LandingIcon icon={FileTextIcon} />
						<span className="font-medium text-sm">
							<Trans id="home.ready">Resume ready</Trans>
						</span>
					</div>
				</div>
			</div>
		</section>
	);
}
