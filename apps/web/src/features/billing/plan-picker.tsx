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

type Money = (usd: number) => string;

type PlanTabsProps = {
	value: CheckoutPlan;
	onChange: (plan: CheckoutPlan) => void;
	/** The one-time trial tab, only for users who have never used it. */
	showTrial: boolean;
};

/** Yearly / Monthly / 7-day trial tabs, shared by the landing pricing and the in-app picker. */
export function PlanTabs({ value, onChange, showTrial }: PlanTabsProps) {
	const plans: CheckoutPlan[] = showTrial ? ["yearly", "monthly", "trial"] : ["yearly", "monthly"];

	return (
		<fieldset
			aria-label={t({ id: "home.pricing.period", message: "Billing period" })}
			className="inline-flex flex-wrap gap-1 rounded-xl border p-1"
		>
			{plans.map((plan) => (
				<button
					key={plan}
					type="button"
					aria-pressed={value === plan}
					onClick={() => onChange(plan)}
					className={cn(
						"flex min-h-9 items-center gap-1.5 rounded-lg px-3 font-medium text-sm transition-colors",
						value === plan
							? "bg-primary text-primary-foreground"
							: "text-muted-foreground hover:bg-muted hover:text-foreground",
					)}
				>
					{plan === "yearly" ? (
						<>
							<Trans id="home.pricing.yearly">Yearly</Trans>
							<span className="rounded-full bg-accent-light px-2 py-0.5 font-semibold text-primary text-xs">
								<Trans id="home.pricing.discount">Save 75%</Trans>
							</span>
						</>
					) : plan === "monthly" ? (
						<Trans id="home.pricing.monthly">Monthly</Trans>
					) : (
						<Trans id="billing.tabs.trial">7-day trial</Trans>
					)}
				</button>
			))}
		</fieldset>
	);
}

/** The trial tab's price: a single $3 charge in the visitor's currency. */
export function TrialPrice({
	money,
	className,
	suffixClassName,
}: {
	money: Money;
	className?: string;
	suffixClassName?: string;
}) {
	return (
		<>
			<bdi className={className}>{money(PRO_PRICES.trial)}</bdi>
			<span className={suffixClassName}>
				<Trans id="billing.trial.oneTime">one-time</Trans>
			</span>
		</>
	);
}

/** What the trial is, and the promise that nothing follows it. */
export function TrialNote() {
	return <Trans id="billing.trial.note">7 days of every Pro tool. No auto-renewal: nothing is charged after.</Trans>;
}

type PlanPickerProps = {
	/** Hide the one-time trial (e.g. for users who already used it). */
	hideTrial?: boolean;
	className?: string;
};

/** Pro plan picker shared by the upgrade dialog and billing settings. */
export function PlanPicker({ hideTrial = false, className }: PlanPickerProps) {
	const [choice, setChoice] = useState<CheckoutPlan>("yearly");
	const plan = hideTrial && choice === "trial" ? "yearly" : choice;
	const { checkout, pendingPlan, isLoading } = useCheckout();
	const { i18n } = useLingui();
	const { currency, rate } = useLocalizedPricing();
	const money = (value: number) => i18n.number(value * rate, { style: "currency", currency, maximumFractionDigits: 0 });

	return (
		<div className={cn("space-y-4", className)}>
			<div className="rounded-2xl border border-accent/60 bg-card p-5 text-card-foreground shadow-md sm:p-6">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<p className="flex items-center gap-2 font-display font-semibold text-xl">
						<SparkleIcon weight="fill" className="size-5 text-primary" aria-hidden="true" />
						Pro
					</p>
					<PlanTabs value={plan} onChange={setChoice} showTrial={!hideTrial} />
				</div>

				<div aria-live="polite" aria-atomic="true" className="mt-4">
					{plan === "trial" ? (
						<>
							<p className="flex flex-wrap items-baseline gap-2">
								<TrialPrice money={money} className="font-semibold text-4xl" />
							</p>
							<p className="mt-1 text-muted-foreground text-sm">
								<TrialNote />
							</p>
						</>
					) : (
						<>
							<p className="flex flex-wrap items-baseline gap-2">
								{plan === "yearly" && (
									<s className="text-lg text-muted-foreground">
										<bdi>{money(PRO_PRICES.monthly)}</bdi>
									</s>
								)}
								<bdi className="font-semibold text-4xl">{money(PRO_PRICES[plan])}</bdi>
								<span>
									<Trans id="home.pricing.month">/month</Trans>
								</span>
							</p>
							<p className="mt-1 text-muted-foreground text-sm">
								{plan === "yearly" ? (
									<Trans id="billing.picker.yearlyNote">
										Billed <bdi>{money(PRO_PRICES.yearlyTotal)}</bdi> once a year — less than a coffee a month.
									</Trans>
								) : (
									<Trans id="home.pricing.flexible">Prefer flexibility? Choose the monthly option.</Trans>
								)}
							</p>
						</>
					)}
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
					onClick={() => checkout(plan)}
					className="mt-5 h-auto min-h-12 w-full whitespace-normal py-3 font-semibold"
				>
					{pendingPlan === plan ? (
						<Trans id="home.pricing.loading">Redirecting to checkout...</Trans>
					) : plan === "trial" ? (
						<Trans id="home.pricing.startTrial">Start 7-day trial</Trans>
					) : (
						<Trans id="home.pricing.getPro">Get Pro</Trans>
					)}
				</Button>
				<p className="mt-2 flex items-center justify-center gap-1.5 text-muted-foreground text-xs">
					<LockSimpleIcon aria-hidden="true" className="size-3.5" />
					<Trans id="billing.picker.reassurance">Secure checkout · Cancel anytime · Your resumes stay yours</Trans>
				</p>
			</div>
		</div>
	);
}
