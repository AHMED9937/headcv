import { Trans } from "@lingui/react/macro";
import { CrownSimpleIcon, SparkleIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@headcv/ui/components/button";
import { cn } from "@headcv/utils/style";
import { PlanPicker } from "@/features/billing/plan-picker";
import { NEAR_LIMIT_RATIO, usageRatio, useSubscription } from "@/features/billing/use-subscription";
import { client } from "@/libs/orpc/client";

export const Route = createFileRoute("/dashboard/settings/billing")({
	component: BillingPage,
});

type UsageMeterProps = { label: React.ReactNode; used: number; limit: number };

function UsageMeter({ label, used, limit }: UsageMeterProps) {
	const unlimited = limit === -1;
	const ratio = usageRatio(used, limit);
	const left = Math.max(0, limit - used);

	return (
		<div className="space-y-1.5">
			<div className="flex items-center justify-between text-sm">
				<span>{label}</span>
				<span className={cn("font-medium", !unlimited && ratio >= NEAR_LIMIT_RATIO && "text-amber-700")}>
					{unlimited ? (
						<Trans id="billing.usage.unlimited">Unlimited</Trans>
					) : (
						<Trans id="billing.usage.left">
							{left} of {limit} left
						</Trans>
					)}
				</span>
			</div>
			{!unlimited && (
				<div className="h-2 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
					<div
						className={cn(
							"h-full rounded-full transition-all",
							ratio >= 1 ? "bg-red-500" : ratio >= NEAR_LIMIT_RATIO ? "bg-amber-500" : "bg-primary",
						)}
						style={{ width: `${ratio * 100}%` }}
					/>
				</div>
			)}
		</div>
	);
}

function BillingPage() {
	const { sub, isLoading, isError, isPaid, isTrial, trialDaysLeft, trialEligible, showUpgrade, refetch } =
		useSubscription();
	const [refreshing, setRefreshing] = useState(false);
	const [portalLoading, setPortalLoading] = useState(false);

	const handleRefresh = async () => {
		setRefreshing(true);
		try {
			// Try to verify and activate a pending subscription, then refetch.
			await client.billing.verifyAndActivate({});
			await refetch();
		} catch {
			// Status stays pending; the banner remains so the user can retry.
		} finally {
			setRefreshing(false);
		}
	};

	const handlePortal = async () => {
		setPortalLoading(true);
		try {
			const result = await client.billing.getCustomerPortal({});
			window.location.href = result.portalUrl;
		} catch {
			setPortalLoading(false);
		}
	};

	if (isLoading) {
		return (
			<div className="py-8 text-center text-muted-foreground">
				<Trans id="billing.loading">Loading billing information...</Trans>
			</div>
		);
	}

	if (isError || !sub) {
		return (
			<div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
				<Trans id="billing.error">We couldn't load your plan right now.</Trans>
				<Button onClick={() => refetch()} variant="outline" size="sm" className="ms-3">
					<Trans id="billing.retry">Try again</Trans>
				</Button>
			</div>
		);
	}

	const isPending = sub.status === "pending";
	const isOnHold = sub.status === "on_hold";
	const isCancelled = sub.status === "cancelled" && sub.cancelAtPeriodEnd;
	const isFailed = sub.status === "failed";
	const periodEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : null;
	const trialEnd = sub.trialEndsAt ? new Date(sub.trialEndsAt).toLocaleDateString() : null;
	const isTrialPass = sub.plan === "trial_pass";

	return (
		<div className="space-y-6">
			{/* Status banners */}
			{isPending && (
				<div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
					<p className="font-medium text-blue-800 text-sm">
						<Trans id="billing.banner.pending">
							Your payment is being processed. If you just completed checkout, click Refresh to activate your
							subscription.
						</Trans>
					</p>
					<Button onClick={handleRefresh} disabled={refreshing} variant="outline" className="mt-2" size="sm">
						{refreshing ? (
							<Trans id="billing.refresh.loading">Checking...</Trans>
						) : (
							<Trans id="billing.refresh">Refresh Status</Trans>
						)}
					</Button>
				</div>
			)}
			{isOnHold && (
				<div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
					<p className="font-medium text-amber-800 text-sm">
						<Trans id="billing.banner.onHold">
							There's an issue with your payment method. Your access is limited until the payment is resolved.
						</Trans>
					</p>
				</div>
			)}
			{isFailed && (
				<div className="rounded-lg border border-red-200 bg-red-50 p-4">
					<p className="font-medium text-red-800 text-sm">
						<Trans id="billing.banner.failed">
							Your last payment failed. Please update your payment method or subscribe again.
						</Trans>
					</p>
				</div>
			)}

			<div className="grid gap-6 lg:grid-cols-2">
				<section
					aria-labelledby="current-plan-heading"
					className={cn(
						"rounded-2xl border p-6",
						isPaid && !isTrial && "border-primary/30 bg-linear-to-br from-primary/10 to-transparent",
					)}
				>
					<h2 id="current-plan-heading" className="font-semibold text-muted-foreground text-sm">
						<Trans id="billing.plan.title">Current Plan</Trans>
					</h2>
					<p className="mt-2 flex items-center gap-2 font-display font-semibold text-3xl">
						{isPaid && !isTrial && <CrownSimpleIcon weight="fill" aria-hidden="true" className="size-7 text-primary" />}
						{isTrial ? (
							<Trans id="billing.plan.trial">Pro Trial</Trans>
						) : isPaid ? (
							<span className="capitalize">Pro {sub.plan}</span>
						) : (
							<Trans id="billing.plan.free">Free</Trans>
						)}
					</p>
					<p className="mt-2 text-muted-foreground text-sm">
						{/* A trial cancelled in the portal ends without a charge, so the cancellation note comes first. */}
						{isCancelled && periodEnd ? (
							<span className="text-amber-700">
								<Trans id="billing.cancelPending">
									Your Pro plan ends on {periodEnd}. You'll keep full access until then.
								</Trans>
							</span>
						) : isTrialPass && trialDaysLeft !== null && trialEnd ? (
							<Trans id="billing.plan.trialPass">
								{trialDaysLeft} days left in your trial. It ends on {trialEnd}, and nothing renews.
							</Trans>
						) : isTrial && trialDaysLeft !== null ? (
							<Trans id="billing.plan.trialLeft">{trialDaysLeft} days left in your trial.</Trans>
						) : isPaid && periodEnd ? (
							<Trans id="billing.plan.renews">Renews on {periodEnd}.</Trans>
						) : (
							<Trans id="billing.plan.freeNote">
								You're building for free. Upgrade anytime for unlimited everything.
							</Trans>
						)}
					</p>
					{/* The one-time pass has no subscription to manage. */}
					{isPaid && !isTrialPass && (
						<Button onClick={handlePortal} disabled={portalLoading} variant="outline" className="mt-4">
							{portalLoading ? (
								<Trans id="billing.portal.loading">Opening portal...</Trans>
							) : (
								<Trans id="billing.portal.manage">Manage Subscription</Trans>
							)}
						</Button>
					)}
				</section>

				<section aria-labelledby="usage-heading" className="rounded-2xl border p-6">
					<h2 id="usage-heading" className="font-semibold text-muted-foreground text-sm">
						<Trans id="billing.usage.title">Usage</Trans>
					</h2>
					<div className="mt-4 space-y-4">
						<UsageMeter
							label={<Trans id="billing.usage.resumes">Resumes</Trans>}
							used={sub.usage.resumesUsed}
							limit={sub.usage.resumesLimit}
						/>
						<UsageMeter
							label={<Trans id="billing.usage.chats">AI Chats</Trans>}
							used={sub.usage.aiChatsUsed}
							limit={sub.usage.aiChatsLimit}
						/>
					</div>
				</section>
			</div>

			{showUpgrade && (
				<section aria-labelledby="upgrade-heading" className="space-y-3">
					<h2 id="upgrade-heading" className="flex items-center gap-2 font-display font-semibold text-xl">
						<SparkleIcon weight="fill" aria-hidden="true" className="size-5 text-primary" />
						{isTrialPass ? (
							<Trans id="billing.upgrade.keepPro">Keep Pro after your trial</Trans>
						) : (
							<Trans id="billing.upgrade.title">Upgrade to Pro</Trans>
						)}
					</h2>
					<PlanPicker hideTrial={!trialEligible} className="max-w-2xl" />
				</section>
			)}
		</div>
	);
}
