import type { CheckoutPlan } from "@/features/billing/use-subscription";
import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { CheckIcon } from "@phosphor-icons/react";
import { Link, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@headcv/ui/components/button";
import { cn } from "@headcv/utils/style";
import { getProFeatures, PlanTabs, TrialNote, TrialPrice } from "@/features/billing/plan-picker";
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
	const [choice, setChoice] = useState<CheckoutPlan>("yearly");
	const { i18n } = useLingui();
	const { currency, rate } = useLocalizedPricing();
	const money = (value: number) => i18n.number(value * rate, { style: "currency", currency, maximumFractionDigits: 0 });
	const { checkout: handleCheckout, isLoading: checkoutLoading } = useCheckout();
	const { session } = useRouteContext({ strict: false });
	const { trialEligible } = useSubscription({ enabled: !!session });
	const plan = !trialEligible && choice === "trial" ? "yearly" : choice;
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
				<div className="mt-10 grid items-stretch gap-6 md:grid-cols-2">
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
						<div className="flex flex-wrap items-center justify-between gap-3">
							<h3 className="shrink-0 font-display font-semibold text-3xl">Pro</h3>
							<PlanTabs value={plan} onChange={setChoice} showTrial={trialEligible} />
						</div>
						<div aria-live="polite" aria-atomic="true" className="mt-5">
							{plan === "trial" ? (
								<>
									<p className="flex flex-wrap items-baseline gap-1">
										<TrialPrice money={money} className="font-semibold text-5xl" suffixClassName="font-semibold" />
									</p>
									<p className="mt-2 text-muted-foreground text-sm">
										<TrialNote />
									</p>
								</>
							) : (
								<>
									<p className="flex flex-wrap items-baseline gap-1">
										<bdi className="font-semibold text-5xl">{money(plan === "yearly" ? 5 : 20)}</bdi>
										<span className="font-semibold">
											<Trans id="home.pricing.month">/month</Trans>
										</span>
									</p>
									<p className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
										{plan === "yearly" ? (
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
								</>
							)}
						</div>
						<Button
							disabled={checkoutLoading}
							onClick={() => handleCheckout(plan)}
							className="mt-5 h-auto min-h-14 w-full whitespace-normal py-3 font-semibold"
						>
							{checkoutLoading ? (
								<Trans id="home.pricing.loading">Redirecting to checkout...</Trans>
							) : plan === "trial" ? (
								<Trans id="home.pricing.startTrial">Start 7-day trial</Trans>
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
