import type { CheckoutPlan } from "./use-subscription";
import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { CheckIcon, LockSimpleIcon, SparkleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@headcv/ui/components/button";
import { cn } from "@headcv/utils/style";
import { useCheckout, useLocalizedPricing } from "./use-subscription";

const PRO_PRICES = { monthly: 20, yearly: 5, yearlyTotal: 60, trial: 3 } as const;

export const getProFeatures = () => [
	t`Unlimited resumes`,
	t`Unlimited imports`,
	t`Job Application Tracker`,
	t`AI features`,
];

type PlanPickerProps = {
	/** Hide the $3 trial offer (e.g. for users already on the trial). */
	hideTrial?: boolean;
	className?: string;
};

/** Pro plan picker shared by the upgrade dialog and billing settings. */
export function PlanPicker({ hideTrial = false, className }: PlanPickerProps) {
	const [period, setPeriod] = useState<"monthly" | "yearly">("yearly");
	const { checkout, pendingPlan, isLoading } = useCheckout();
	const { i18n } = useLingui();
	const { currency, rate } = useLocalizedPricing();
	const money = (value: number) => i18n.number(value * rate, { style: "currency", currency, maximumFractionDigits: 0 });

	const ctaLabel = (plan: CheckoutPlan, label: React.ReactNode) =>
		pendingPlan === plan ? <Trans id="home.pricing.loading">Redirecting to checkout...</Trans> : label;

	return (
		// A container, not the viewport, drives the layout: the picker is reused in a narrow dialog and on
		// the wide billing page, and localized prices (e.g. "EGP 161") vary in width.
		<div className={cn("@container space-y-4", className)}>
			{!hideTrial && (
				<div className="grid @sm:grid-cols-[auto_minmax(0,1fr)] @xl:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-[#c9a227] bg-linear-to-r from-[#f5e8bf] to-[#fffaf0] p-4 text-[#152642]">
					<bdi className="font-bold font-display text-3xl">{money(PRO_PRICES.trial)}</bdi>
					<div className="min-w-0">
						<p className="font-semibold">
							<Trans id="home.offer.title">Try all of Pro.</Trans>
						</p>
						<p className="text-sm">
							<Trans id="billing.picker.trialNote">7 days of every Pro tool. Not sure yet? Start here.</Trans>
						</p>
					</div>
					<Button
						disabled={isLoading}
						onClick={() => checkout("trial")}
						className="@sm:col-span-2 @xl:col-span-1 h-auto min-h-11 whitespace-normal bg-[#152642] px-5 py-2 text-white hover:bg-[#152642]/90"
					>
						{ctaLabel("trial", <Trans id="home.pricing.startTrial">Start 7-day trial</Trans>)}
					</Button>
				</div>
			)}

			<div className="rounded-2xl border border-accent/60 bg-card p-5 text-card-foreground shadow-md sm:p-6">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<p className="flex items-center gap-2 font-display font-semibold text-xl">
						<SparkleIcon weight="fill" className="size-5 text-primary" aria-hidden="true" />
						Pro
					</p>
					<fieldset
						aria-label={t({ id: "home.pricing.period", message: "Billing period" })}
						className="inline-flex gap-1 rounded-xl border p-1"
					>
						{(["yearly", "monthly"] as const).map((value) => (
							<button
								key={value}
								type="button"
								aria-pressed={period === value}
								onClick={() => setPeriod(value)}
								className={cn(
									"flex min-h-9 items-center gap-1.5 rounded-lg px-3 font-medium text-sm transition-colors",
									period === value
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:bg-muted hover:text-foreground",
								)}
							>
								{value === "yearly" ? (
									<>
										<Trans id="home.pricing.yearly">Yearly</Trans>
										<span className="rounded-full bg-accent-light px-2 py-0.5 font-semibold text-primary text-xs">
											<Trans id="home.pricing.discount">Save 75%</Trans>
										</span>
									</>
								) : (
									<Trans id="home.pricing.monthly">Monthly</Trans>
								)}
							</button>
						))}
					</fieldset>
				</div>

				<div aria-live="polite" aria-atomic="true" className="mt-4">
					<p className="flex flex-wrap items-baseline gap-2">
						{period === "yearly" && (
							<s className="text-lg text-muted-foreground">
								<bdi>{money(PRO_PRICES.monthly)}</bdi>
							</s>
						)}
						<bdi className="font-semibold text-4xl">{money(PRO_PRICES[period])}</bdi>
						<span>
							<Trans id="home.pricing.month">/month</Trans>
						</span>
					</p>
					<p className="mt-1 text-muted-foreground text-sm">
						{period === "yearly" ? (
							<Trans id="billing.picker.yearlyNote">
								Billed <bdi>{money(PRO_PRICES.yearlyTotal)}</bdi> once a year — less than a coffee a month.
							</Trans>
						) : (
							<Trans id="home.pricing.flexible">Prefer flexibility? Choose the monthly option.</Trans>
						)}
					</p>
				</div>

				<p className="mt-5 text-muted-foreground text-sm">
					<Trans>Includes all Free features, plus:</Trans>
				</p>
				<ul className="mt-3 grid gap-2 sm:grid-cols-2">
					{getProFeatures().map((feature) => (
						<li key={feature} className="flex items-start gap-2 text-sm">
							<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
								<CheckIcon weight="bold" aria-hidden="true" className="size-3.5" />
							</span>
							{feature}
						</li>
					))}
				</ul>

				<Button
					disabled={isLoading}
					onClick={() => checkout(period)}
					className="mt-5 h-auto min-h-12 w-full whitespace-normal py-3 font-semibold"
				>
					{ctaLabel(period, <Trans id="home.pricing.getPro">Get Pro</Trans>)}
				</Button>
				<p className="mt-2 flex items-center justify-center gap-1.5 text-muted-foreground text-xs">
					<LockSimpleIcon aria-hidden="true" className="size-3.5" />
					<Trans id="billing.picker.reassurance">Secure checkout · Cancel anytime · Your resumes stay yours</Trans>
				</p>
			</div>
		</div>
	);
}
