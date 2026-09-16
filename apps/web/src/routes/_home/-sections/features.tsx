import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
	CheckCircleIcon,
	DownloadSimpleIcon,
	FileArrowUpIcon,
	FileTextIcon,
	LayoutIcon,
	PaletteIcon,
	ShieldCheckIcon,
} from "@phosphor-icons/react";
import { cn } from "@headcv/utils/style";
import { LandingIcon } from "./landing-icon";
import { landingIconHover, landingSurfaceHover } from "./landing-motion";

export function Features() {
	const features = [
		{
			icon: FileTextIcon,
			title: t({ id: "home.free.start", message: "Start with a free resume" }),
			description: t({
				id: "home.free.startText",
				message: "Write, edit and preview your resume. No credit card needed to begin.",
			}),
		},
		{
			icon: ShieldCheckIcon,
			title: t({ id: "home.free.watermark", message: "Your name. Not our branding." }),
			description: t({
				id: "home.free.watermarkText",
				message: "Your PDF is yours to share, without a HeadCV logo or watermark.",
			}),
		},
		{
			icon: DownloadSimpleIcon,
			title: t({ id: "home.free.download", message: "PDFs, whenever you need" }),
			description: t({
				id: "home.free.downloadText",
				message: "Keep your resume current and download a fresh copy for your next application.",
			}),
		},
		{
			icon: LayoutIcon,
			title: t({ id: "home.free.templates", message: "Find your format" }),
			description: t({
				id: "home.free.templatesText",
				message: "Choose from our resume templates, with room for your experience and personality.",
			}),
		},
		{
			icon: FileArrowUpIcon,
			title: t({ id: "home.free.import", message: "Skip the blank page" }),
			description: t({
				id: "home.free.importText",
				message: "Import an existing resume or build a new one, section by section.",
			}),
		},
		{
			icon: PaletteIcon,
			title: t({ id: "home.free.design", message: "Make every detail yours" }),
			description: t({
				id: "home.free.designText",
				message: "Adjust your fonts, colors and spacing for a resume that feels like you.",
			}),
		},
	];
	return (
		<section aria-labelledby="included-heading" className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
			<div className="mx-auto max-w-7xl">
				{/* Header */}
				<div className="mx-auto mb-12 max-w-3xl text-center">
					<h2 id="included-heading" className="font-bold font-display text-3xl text-primary sm:text-4xl">
						<Trans id="home.free.heading">Everything you need to get started</Trans>
					</h2>
					<p className="mt-4 text-lg text-muted-foreground">
						<Trans id="home.free.intro">Focus on your next opportunity. We will help with the resume.</Trans>
					</p>
				</div>
				{/* Features Grid */}
				<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
					{features.map(({ icon: Icon, title, description }) => (
						<div
							key={title}
							className={cn("group relative rounded-2xl border bg-card p-6 text-start", landingSurfaceHover)}
						>
							{/* Hover gradient overlay */}
							<div
								aria-hidden="true"
								className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-primary/3 to-transparent"
							/>
							{/* Icon */}
							<div className={cn("mb-5 w-fit", landingIconHover)}>
								<LandingIcon icon={Icon} size="md" />
							</div>
							{/* Content */}
							<h3 className="font-display font-semibold text-lg">{title}</h3>
							<p className="mt-3 text-muted-foreground text-sm leading-relaxed">{description}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

export function FreePromise() {
	return (
		<section aria-labelledby="promise-heading" className="border-y bg-secondary/40 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
			<div className="mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-2 md:gap-16">
				<div className="text-start">
					<p className="mb-3 font-semibold text-primary text-xs uppercase tracking-widest rtl:tracking-normal">
						<Trans id="home.promise.eyebrow">A clear start</Trans>
					</p>
					<h2 id="promise-heading" className="font-bold font-display text-3xl text-primary sm:text-4xl">
						<Trans id="home.promise.title">Your resume. No surprises.</Trans>
					</h2>
					<p className="mt-4 text-muted-foreground leading-relaxed">
						<Trans id="home.promise.text">
							Build and download your resume for free today. Pro is coming later, with pricing shown upfront.
						</Trans>
					</p>
				</div>
				<ul className="rounded-2xl border bg-card p-6 sm:p-8">
					{[
						t({ id: "home.promise.export", message: "Free PDF export" }),
						t({ id: "home.noWatermark", message: "No watermarks" }),
						t({ id: "home.promise.charge", message: "No automatic charges" }),
					].map((text) => (
						<li
							key={text}
							className="flex items-center gap-3 border-b py-4 text-start font-medium first:pt-0 last:border-0 last:pb-0"
						>
							<CheckCircleIcon aria-hidden="true" className="size-5 shrink-0 text-primary" />
							{text}
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
