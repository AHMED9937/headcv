import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { CheckIcon } from "@phosphor-icons/react";
import { Link, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@headcv/ui/components/button";
import { Switch } from "@headcv/ui/components/switch";
import { cn } from "@headcv/utils/style";
import { getProFeatures } from "@/features/billing/plan-picker";
import { useCheckout, useLocalizedPricing, useSubscription } from "@/features/billing/use-subscription";

function Benefits({ items, premium = false }: { items: string[]; premium?: boolean }) {
	return (
		<ul className="mt-4 space-y-3">
			{items.map((item) => (
				<li key={item} className="flex items-start gap-3 text-start text-sm leading-relaxed sm:text-base">
					<span
						className={cn(
							"mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
							premium ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
						)}
					>
						<CheckIcon weight="bold" aria-hidden="true" className="size-4" />
					</span>
					<span className="pt-0.5">{item}</span>
				</li>
			))}
		</ul>
	);
}

export function Pricing() {
	const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
	const { i18n } = useLingui();
	const { currency, rate } = useLocalizedPricing();
	const money = (value: number) => i18n.number(value * rate, { style: "currency", currency, maximumFractionDigits: 0 });
	const { checkout: handleCheckout, isLoading: checkoutLoading } = useCheckout();
	const { session } = useRouteContext({ strict: false });
	const { trialEligible } = useSubscription({ enabled: !!session });
	const freeFeatures = [
		t`3 resumes`,
		t`Unlimited PDF downloads`,
		t`No watermarks or branding`,
		t`All resume templates`,
		t`Full design customization`,
	];
	const proFeatures = getProFeatures();

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
						The free builder is available now. Upgrade to Pro for unlimited imports and AI assistance.
					</Trans>
				</p>
				{trialEligible && (
					<section
						aria-labelledby="trial-heading"
						className="mx-auto mt-10 grid max-w-4xl grid-cols-[auto_minmax(0,1fr)] items-center gap-5 rounded-2xl border border-[#c9a227] bg-linear-to-r from-[#f5e8bf] to-[#fffaf0] p-5 text-start text-[#152642] sm:p-6 lg:grid-cols-[auto_minmax(0,1fr)_auto]"
					>
						<div className="border-[#b39235] border-e border-dashed pe-5">
							<bdi className="font-bold font-display text-5xl tracking-tight">{money(3)}</bdi>
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
							disabled={checkoutLoading}
							onClick={() => handleCheckout("trial")}
							className="col-span-2 h-auto min-h-11 whitespace-normal bg-[#152642] px-5 py-3 text-white lg:col-span-1"
						>
							{checkoutLoading ? (
								<Trans id="home.pricing.loading">Redirecting to checkout...</Trans>
							) : (
								<Trans id="home.pricing.startTrial">Start 7-day trial</Trans>
							)}
						</Button>
					</section>
				)}
				<div className={cn("grid items-stretch gap-6 md:grid-cols-2", trialEligible ? "mt-6" : "mt-10")}>
					{/* Free */}
					<div className="flex h-full flex-col rounded-2xl border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
						<h3 className="font-display font-semibold text-3xl">
							<Trans id="home.pricing.free">Free</Trans>
						</h3>
						<p className="mt-5 flex flex-wrap items-baseline gap-1">
							<bdi className="font-semibold text-5xl">{money(0)}</bdi>
							<span className="font-semibold">
								<Trans id="home.pricing.month">/month</Trans>
							</span>
						</p>
						<p className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
							<Trans>Free forever</Trans>
							<span aria-hidden="true">•</span>
							<Trans>No credit card required</Trans>
						</p>
						<Button
							nativeButton={false}
							variant="outline"
							className="mt-5 h-auto min-h-14 w-full whitespace-normal py-3 font-semibold"
							render={<Link to="/templates" search={{}} />}
						>
							<Trans id="home.pricing.create">Create my free resume</Trans>
						</Button>
						<div className="mt-9 flex-1">
							<p className="text-muted-foreground text-sm">
								<Trans>Everything you need for a professional resume:</Trans>
							</p>
							<Benefits items={freeFeatures} />
						</div>
					</div>
					{/* Pro */}
					<div className="flex h-full flex-col rounded-2xl border border-accent/60 bg-card p-6 text-card-foreground shadow-md sm:p-8">
						<div className="flex items-center justify-between gap-3">
							<h3 className="shrink-0 font-display font-semibold text-3xl">Pro</h3>
							{/* Billing toggle */}
							<div className="flex shrink-0 items-center gap-2.5 whitespace-nowrap">
								<span className="rounded-full bg-accent-light px-2 py-0.5 font-semibold text-primary text-xs">
									<Trans>-75%</Trans>
								</span>
								<Switch
									checked={billing === "yearly"}
									onCheckedChange={(checked) => setBilling(checked ? "yearly" : "monthly")}
									aria-label={billing === "yearly" ? t`Yearly billing` : t`Monthly billing`}
								/>
								<span className="text-sm">
									{billing === "yearly" ? <Trans>Yearly billing</Trans> : <Trans>Monthly billing</Trans>}
								</span>
							</div>
						</div>
						<div aria-live="polite" aria-atomic="true" className="mt-5">
							<p className="flex flex-wrap items-baseline gap-1">
								<bdi className="font-semibold text-5xl">{money(billing === "yearly" ? 5 : 20)}</bdi>
								<span className="font-semibold">
									<Trans id="home.pricing.month">/month</Trans>
								</span>
							</p>
							<p className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
								{billing === "yearly" ? (
									<Trans>
										<bdi>{money(60)}</bdi> billed yearly
									</Trans>
								) : (
									<Trans>
										<bdi>{money(20)}</bdi> billed monthly
									</Trans>
								)}
								<span aria-hidden="true">•</span>
								<Trans>Cancel anytime</Trans>
							</p>
						</div>
						<Button
							disabled={checkoutLoading}
							onClick={() => handleCheckout(billing)}
							className="mt-5 h-auto min-h-14 w-full whitespace-normal py-3 font-semibold"
						>
							{checkoutLoading ? (
								<Trans id="home.pricing.loading">Redirecting to checkout...</Trans>
							) : (
								<Trans id="home.pricing.getPro">Get Pro</Trans>
							)}
						</Button>
						<div className="mt-9 flex-1">
							<p className="text-muted-foreground text-sm">
								<Trans>Includes all Free features, plus:</Trans>
							</p>
							<Benefits items={proFeatures} premium />
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
