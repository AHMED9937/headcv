import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { ArrowRightIcon, ArrowsClockwiseIcon, EyeIcon, SlidersIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { templateSchema } from "@headcv/schema/templates";
import { Button } from "@headcv/ui/components/button";
import { cn } from "@headcv/utils/style";
import { LandingIcon } from "./landing-icon";
import { landingArrowHover, landingInteractiveCard, landingMediaHover } from "./landing-motion";

const featuredTemplates = [
	{
		id: "rhyhorn",
		name: "Rhyhorn",
		style: msg({ id: "home.template.minimal", message: "The minimalist" }),
		description: msg({ id: "home.template.minimalText", message: "Clean lines. Your experience takes the lead." }),
	},
	{
		id: "chikorita",
		name: "Chikorita",
		style: msg({ id: "home.template.fresh", message: "The fresh perspective" }),
		description: msg({ id: "home.template.freshText", message: "A navy sidebar with room for your strengths." }),
	},
	{
		id: "pikachu",
		name: "Pikachu",
		style: msg({ id: "home.template.bold", message: "The statement" }),
		description: msg({ id: "home.template.boldText", message: "A bold portrait. A warm touch of gold." }),
	},
	{
		id: "lapras",
		name: "Lapras",
		style: msg({ id: "home.template.modern", message: "The modern thinker" }),
		description: msg({ id: "home.template.modernText", message: "Neat sections. A clear story from top to bottom." }),
	},
] as const;

export function TemplatesShowcase() {
	const { i18n } = useLingui();
	const count = templateSchema.options.length;
	return (
		<section
			id="templates"
			aria-labelledby="templates-heading"
			className="scroll-mt-24 border-y bg-card px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
		>
			<div className="mx-auto max-w-7xl">
				<div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
					<div className="max-w-2xl text-start">
						<p className="mb-3 font-semibold text-primary text-xs uppercase tracking-widest rtl:tracking-normal">
							<Trans id="home.nav.templates">Templates</Trans>
						</p>
						<h2 id="templates-heading" className="font-bold font-display text-3xl text-primary sm:text-4xl lg:text-5xl">
							<Trans id="home.templates.title">A CV that feels like you</Trans>
						</h2>
						<p className="mt-4 text-lg text-muted-foreground">
							<Trans id="home.templates.intro">
								Four different looks. One next step. Pick your style and make it yours.
							</Trans>
						</p>
					</div>
					<Button
						nativeButton={false}
						variant="secondary"
						className="h-auto min-h-11 gap-2 self-start whitespace-normal px-5 py-3"
						render={<Link to="/templates" search={{}} />}
					>
						<Trans id="home.templates.all">Explore all {count} templates</Trans>
						<ArrowRightIcon aria-hidden="true" className="rtl-flip size-4" />
					</Button>
				</div>
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
					{featuredTemplates.map((template) => (
						<Link
							key={template.id}
							to="/templates"
							search={{ template: template.id }}
							className={cn(
								"group flex flex-col overflow-hidden rounded-2xl border bg-background text-start shadow-sm focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4",
								landingInteractiveCard,
							)}
						>
							<div className="bg-secondary/40 px-5 pt-5 pb-6">
								<p className="mb-4 text-muted-foreground text-xs">{i18n.t(template.style)}</p>
								<div className="mx-auto max-w-64 overflow-hidden rounded-sm bg-white shadow-md">
									<img
										src={
											template.id === "chikorita"
												? "/templates/chikorita-hero-vector.svg"
												: `/templates/svg/${template.id}.svg`
										}
										alt={i18n._({
											id: "home.templates.preview",
											message: "{name} resume template",
											values: { name: template.name },
										})}
										width={1055}
										height={1491}
										loading="lazy"
										decoding="async"
										className={cn("h-auto w-full", landingMediaHover)}
									/>
								</div>
							</div>
							<div className="flex flex-1 flex-col p-5">
								<h3 className="font-display font-semibold text-xl">
									<bdi>{template.name}</bdi>
								</h3>
								<p className="mt-2 flex-1 text-muted-foreground text-sm leading-relaxed">
									{i18n.t(template.description)}
								</p>
								<span className="mt-5 flex min-h-11 items-center justify-between gap-3 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground text-sm">
									<Trans id="home.templates.choose">Make it mine</Trans>
									<ArrowRightIcon aria-hidden="true" className={cn("rtl-flip size-4 shrink-0", landingArrowHover)} />
								</span>
							</div>
						</Link>
					))}
				</div>
				<ul className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-4 text-muted-foreground text-sm">
					<li className="flex items-center gap-2">
						<LandingIcon icon={EyeIcon} />
						<Trans id="home.templates.live">Live preview</Trans>
					</li>
					<li className="flex items-center gap-2">
						<LandingIcon icon={SlidersIcon} />
						<Trans id="home.templates.edit">Fully editable</Trans>
					</li>
					<li className="flex items-center gap-2">
						<LandingIcon icon={ArrowsClockwiseIcon} />
						<Trans id="home.templates.switch">Switch anytime</Trans>
					</li>
				</ul>
			</div>
		</section>
	);
}
