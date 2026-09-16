import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { CheckIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@headcv/ui/components/button";
import { cn } from "@headcv/utils/style";

function Benefits({ items, pro = false }: { items: string[]; pro?: boolean }) {
	return (
		<ul className={cn("mt-7 divide-y", pro ? "divide-primary-foreground/20" : "divide-border")}>
			{items.map((item) => (
				<li
					key={item}
					className="flex items-start gap-3 py-4 text-start font-medium text-sm leading-relaxed sm:text-base"
				>
					<CheckIcon
						aria-hidden="true"
						className={cn("mt-1 size-4 shrink-0", pro ? "text-primary-foreground" : "text-primary")}
					/>
					{item}
				</li>
			))}
		</ul>
	);
}

export function Pricing() {
	const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
	const { i18n } = useLingui();
	const money = (value: number) => i18n.number(value, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
	const freeFeatures = [
		t({ id: "home.plan.resume", message: "Create and edit your resume" }),
		t({ id: "home.plan.pdf", message: "Download your PDF" }),
		t({ id: "home.plan.watermark", message: "Watermark-free exports" }),
		t({ id: "home.plan.templates", message: "Every resume template included" }),
		t({ id: "home.plan.design", message: "Your fonts, colors and layout" }),
	];
	const proFeatures = [
		t({ id: "home.pro.resumes", message: "Unlimited resumes for every opportunity" }),
		t({ id: "home.pro.letters", message: "Unlimited matching cover letters" }),
		t({ id: "home.pro.imports", message: "Import without limits" }),
		t({ id: "home.pro.tracker", message: "Your applications, organized" }),
		t({ id: "home.pro.ai", message: "AI assistance for your next draft" }),
	];
	return (
		<section
			id="pricing"
			aria-labelledby="pricing-heading"
			className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
		>
			<div className="mx-auto max-w-6xl">
				<h2
					id="pricing-heading"
					className="text-center font-bold font-display text-3xl text-primary sm:text-4xl lg:text-5xl"
				>
					<Trans id="home.pricing.title">Build your resume for free.</Trans>
					<br />
					<Trans id="home.pricing.subtitle">More possibilities with Pro.</Trans>
				</h2>
				<p className="mx-auto mt-5 max-w-2xl text-center text-muted-foreground leading-relaxed">
					<Trans id="home.pricing.disclosure">
						The free builder is available now. Paid plans are coming soon; the prices below are planned, and no payment
						is taken.
					</Trans>
				</p>
				<div className="mt-10 grid gap-6 md:grid-cols-2">
					{/* Free */}
					<div className="rounded-2xl border bg-card p-6 text-start sm:p-8">
						<h3 className="font-display font-semibold text-2xl">
							<Trans id="home.pricing.free">Free</Trans>
						</h3>
						<p className="mt-5 flex flex-wrap items-baseline gap-2">
							<bdi className="font-semibold text-5xl">{money(0)}</bdi>
							<span className="text-muted-foreground">
								<Trans id="home.pricing.month">/month</Trans>
							</span>
						</p>
						<p className="mt-3 text-muted-foreground text-sm">
							<Trans id="home.noCard">No credit card</Trans>
						</p>
						<Button
							nativeButton={false}
							variant="outline"
							className="mt-6 h-auto min-h-12 w-full whitespace-normal py-3"
							render={<Link to="/templates" search={{}} />}
						>
							<Trans id="home.pricing.create">Create my free resume</Trans>
						</Button>
						<Benefits items={freeFeatures} />
					</div>
					{/* Pro */}
					<div className="rounded-2xl bg-primary p-6 text-start text-primary-foreground shadow-lg sm:p-8">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<h3 className="font-display font-semibold text-2xl">Pro</h3>
							<span className="rounded-full border border-primary-foreground/30 px-3 py-1 font-medium text-xs">
								<Trans id="home.comingSoon">Coming soon</Trans>
							</span>
						</div>
						{/* Billing toggle */}
						<fieldset
							aria-label={t({ id: "home.pricing.period", message: "Billing period" })}
							className="mt-5 inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-primary-foreground/20 p-1"
						>
							<Button
								aria-pressed={billing === "monthly"}
								onClick={() => setBilling("monthly")}
								className={cn(
									"h-auto min-h-11 whitespace-normal px-4 py-2",
									billing === "monthly"
										? "bg-primary-foreground text-primary"
										: "bg-transparent text-primary-foreground hover:bg-primary-foreground/10",
								)}
							>
								<Trans id="home.pricing.monthly">Monthly</Trans>
							</Button>
							<Button
								aria-pressed={billing === "yearly"}
								onClick={() => setBilling("yearly")}
								className={cn(
									"h-auto min-h-11 flex-wrap whitespace-normal px-4 py-2",
									billing === "yearly"
										? "bg-primary-foreground text-primary"
										: "bg-transparent text-primary-foreground hover:bg-primary-foreground/10",
								)}
							>
								<Trans id="home.pricing.yearly">Yearly</Trans>
								<span className="rounded bg-accent px-1.5 py-0.5 text-accent-foreground text-xs">
									<Trans id="home.pricing.discount">Save 75%</Trans>
								</span>
							</Button>
						</fieldset>
						<div aria-live="polite" aria-atomic="true" className="mt-5">
							<p className="flex flex-wrap items-baseline gap-2">
								<bdi className="font-semibold text-5xl">{money(billing === "yearly" ? 5 : 20)}</bdi>
								<span>
									<Trans id="home.pricing.month">/month</Trans>
								</span>
							</p>
							<p className="mt-3 text-sm">
								{billing === "yearly" ? (
									<Trans id="home.pricing.yearTotal">
										Planned annual total: <bdi>{money(60)}</bdi>
									</Trans>
								) : (
									<Trans id="home.pricing.monthTotal">Planned monthly billing</Trans>
								)}
							</p>
							<p className="mt-2 min-h-12 text-sm leading-relaxed">
								{billing === "yearly" ? (
									<Trans id="home.pricing.savings">
										Save <bdi>{money(180)}</bdi> compared with 12 monthly payments.
									</Trans>
								) : (
									<Trans id="home.pricing.flexible">Prefer flexibility? Choose the monthly option.</Trans>
								)}
							</p>
						</div>
						<Button
							disabled
							className="mt-4 h-auto min-h-12 w-full whitespace-normal bg-accent py-3 text-accent-foreground disabled:opacity-100"
						>
							<Trans id="home.pricing.proSoon">Pro is coming soon</Trans>
						</Button>
						<Benefits items={proFeatures} pro />
					</div>
				</div>
				{/* Trial follows the subscription plans. */}
				<section
					aria-labelledby="trial-heading"
					className="mx-auto mt-6 grid max-w-4xl grid-cols-[auto_minmax(0,1fr)] items-center gap-5 rounded-2xl border border-[#c9a227] bg-linear-to-r from-[#f5e8bf] to-[#fffaf0] p-5 text-start text-[#152642] sm:p-6 lg:grid-cols-[auto_minmax(0,1fr)_auto]"
				>
					<div className="border-[#b39235] border-e border-dashed pe-5">
						<bdi className="font-bold font-display text-5xl tracking-tight">
							{i18n.number(3, {
								style: "currency",
								currency: "USD",
								currencyDisplay: "narrowSymbol",
								maximumFractionDigits: 0,
							})}
						</bdi>
					</div>
					<div className="min-w-0">
						<p className="inline-block rounded-lg bg-[#152642] px-4 py-2 font-bold text-sm text-white uppercase tracking-widest rtl:tracking-normal">
							<Trans id="home.offer.label">7-day trial</Trans>
						</p>
						<h3 id="trial-heading" className="mt-2 font-display font-semibold text-xl sm:text-2xl">
							<Trans id="home.offer.title">Try all of Pro.</Trans>
						</h3>
						<p className="mt-1 text-sm leading-relaxed">
							<Trans id="home.offer.description">Every Pro tool. Unlimited resumes.</Trans>
						</p>
					</div>
					<Button
						disabled
						className="col-span-2 h-auto min-h-11 whitespace-normal bg-[#152642] px-5 py-3 text-white disabled:opacity-100 lg:col-span-1"
					>
						<Trans id="home.comingSoon">Coming soon</Trans>
					</Button>
				</section>
			</div>
		</section>
	);
}
