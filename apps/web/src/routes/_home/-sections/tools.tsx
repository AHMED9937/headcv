import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { ColumnsIcon, TextAaIcon, UserCircleIcon } from "@phosphor-icons/react";
import { cn } from "@headcv/utils/style";
import { LandingIcon } from "./landing-icon";
import { TrustMark } from "./trust-mark";

function ResumePreview({ template, className }: { template: string; className?: string }) {
	return (
		<img
			src={template === "chikorita" ? "/templates/chikorita-hero-vector.svg" : `/templates/jpg/${template}.jpg`}
			alt=""
			loading="lazy"
			decoding="async"
			width={1055}
			height={1491}
			className={cn("h-auto w-full rounded-sm border bg-white shadow-md", className)}
		/>
	);
}

function PersonalDetailsPreview() {
	const fields = [
		[t({ id: "home.demo.name", message: "Full name" }), t({ id: "home.demo.person", message: "Alex Morgan" })],
		[
			t({ id: "home.demo.title", message: "Professional title" }),
			t({ id: "home.demo.role", message: "Product designer" }),
		],
		[t({ id: "home.demo.email", message: "Email" }), "alex@example.com"],
	];
	return (
		<div className="rounded-xl border bg-card p-4 text-start sm:p-6">
			<div className="mb-5 flex items-center justify-between gap-3">
				<p className="font-semibold">
					<Trans id="home.demo.details">Personal details</Trans>
				</p>
				<LandingIcon icon={UserCircleIcon} size="md" />
			</div>
			<div className="space-y-3">
				{fields.map(([label, value], index) => (
					<div key={label}>
						<p className="mb-1 text-muted-foreground text-xs">{label}</p>
						<div dir={index === 2 ? "ltr" : undefined} className="rounded-lg border bg-background px-3 py-2 text-sm">
							{value}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function DesignPreview() {
	return (
		<div className="space-y-5 rounded-xl border bg-card p-4 text-start sm:p-6">
			<div>
				<p className="mb-3 flex items-center gap-2 font-semibold">
					<LandingIcon icon={ColumnsIcon} />
					<Trans id="home.demo.layout">Layout</Trans>
				</p>
				<div className="grid grid-cols-2 gap-3">
					{[t({ id: "home.demo.one", message: "One column" }), t({ id: "home.demo.two", message: "Two columns" })].map(
						(label, index) => (
							<div
								key={label}
								className={cn(
									"rounded-lg border p-3 text-center text-xs",
									index === 0 && "border-primary bg-primary/5 text-primary",
								)}
							>
								<div
									className={cn(
										"mx-auto mb-2 grid h-10 w-8 gap-1 rounded-sm border bg-white p-1",
										index === 1 && "grid-cols-2",
									)}
								>
									<span className="bg-primary/30" />
									{index === 1 && <span className="bg-primary/15" />}
								</div>
								{label}
							</div>
						),
					)}
				</div>
			</div>
			<div className="border-t pt-4">
				<p className="mb-3 flex items-center gap-2 font-semibold">
					<LandingIcon icon={TextAaIcon} />
					<Trans id="home.demo.typography">Typography</Trans>
				</p>
				<div className="space-y-3 text-sm">
					<div className="flex flex-wrap justify-between gap-2 rounded-lg border px-3 py-2">
						<span className="text-muted-foreground">
							<Trans id="home.demo.font">Font family</Trans>
						</span>
						<bdi>Inter</bdi>
					</div>
					<div className="flex items-center justify-between gap-3">
						<span className="text-muted-foreground">
							<Trans id="home.demo.size">Font size</Trans>
						</span>
						<span dir="ltr" className="rounded-lg border px-3 py-2">
							10.5 pt
						</span>
					</div>
					<div className="flex items-center justify-between gap-3">
						<span className="text-muted-foreground">
							<Trans id="home.demo.spacing">Line spacing</Trans>
						</span>
						<span dir="ltr" className="rounded-lg border px-3 py-2">
							1.5
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

export function Tools() {
	const steps = [
		{
			title: t({ id: "home.steps.choose", message: "Choose a template" }),
			description: t({
				id: "home.steps.chooseText",
				message: "Start with a layout that fits your story. Switch templates anytime without starting over.",
			}),
			preview: (
				<div className="rounded-xl bg-card p-3 sm:p-5">
					<p className="mb-4 text-start font-medium text-xs">
						<Trans id="home.demo.templates">Simple. Modern. Yours.</Trans>
					</p>
					<div className="grid grid-cols-3 items-start gap-2">
						<ResumePreview template="rhyhorn" />
						<ResumePreview template="chikorita" />
						<ResumePreview template="lapras" />
					</div>
				</div>
			),
		},
		{
			title: t({ id: "home.steps.details", message: "Add your experience" }),
			description: t({
				id: "home.steps.detailsText",
				message:
					"Begin with your personal details, then add the experience and skills that make you stand out. Have a resume already? Import it.",
			}),
			preview: <PersonalDetailsPreview />,
		},
		{
			title: t({ id: "home.steps.design", message: "Customize layout and design" }),
			description: t({
				id: "home.steps.designText",
				message: "Fine-tune your fonts, spacing and colors. See your changes in the preview as you make them.",
			}),
			preview: <DesignPreview />,
		},
		{
			title: t({ id: "home.steps.download", message: "Download your PDF" }),
			description: t({
				id: "home.steps.downloadText",
				message: "Turn your draft into a polished PDF. Update your resume and download it again whenever you need.",
			}),
			preview: (
				<div className="relative px-2 pt-5 pb-10">
					<div dir="ltr" className="grid grid-cols-3 items-center gap-2">
						<ResumePreview template="rhyhorn" className="-rotate-6" />
						<ResumePreview template="pikachu" className="relative z-10 -translate-y-3" />
						<ResumePreview template="ditto" className="rotate-6" />
					</div>
					<div className="absolute inset-x-1 bottom-4 z-20 mx-auto flex w-fit max-w-full items-center gap-2 rounded-lg border bg-card px-3 py-2 text-primary text-xs shadow-lg sm:text-sm">
						<TrustMark />
						<Trans id="home.demo.downloaded">Resume successfully downloaded</Trans>
					</div>
				</div>
			),
		},
	];
	return (
		<section id="features" aria-labelledby="steps-heading" className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
			<div className="mx-auto max-w-7xl">
				<div className="mb-12 max-w-3xl text-start">
					<h2
						id="steps-heading"
						className="font-bold font-display text-3xl text-primary leading-tight sm:text-4xl lg:text-5xl rtl:leading-relaxed"
					>
						<Trans id="home.steps.heading">Create a professional resume in minutes</Trans>
					</h2>
					<p className="mt-4 text-lg text-muted-foreground leading-relaxed">
						<Trans id="home.steps.intro">From a blank page to your next application, in four simple steps.</Trans>
					</p>
				</div>
				<ol className="space-y-14 sm:space-y-20">
					{steps.map((step, index) => (
						<li key={step.title} className="grid items-center gap-6 md:grid-cols-2 md:gap-12 lg:gap-20">
							<div className={cn("text-start", index % 2 === 0 && "md:order-2")}>
								<span aria-hidden="true" className="mb-3 block font-semibold text-4xl text-accent">
									<bdi>{String(index + 1).padStart(2, "0")}</bdi>
								</span>
								<h3 className="font-display font-semibold text-2xl text-primary sm:text-3xl">{step.title}</h3>
								<p className="mt-4 max-w-lg text-base text-muted-foreground leading-relaxed">{step.description}</p>
							</div>
							<div
								aria-hidden="true"
								className={cn(
									"w-full max-w-xl rounded-2xl bg-secondary/50 p-4 sm:p-6",
									index % 2 === 0 && "md:order-1",
								)}
							>
								{step.preview}
							</div>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
}
