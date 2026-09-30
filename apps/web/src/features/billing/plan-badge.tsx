import { Trans } from "@lingui/react/macro";
import { CrownSimpleIcon, SparkleIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Button } from "@headcv/ui/components/button";
import { cn } from "@headcv/utils/style";
import { useDialogStore } from "@/dialogs/store";
import { useSubscription } from "./use-subscription";

type PlanBadgeProps = {
	/** Tighter layout for crowded headers: hides the plan pill below `sm`. */
	compact?: boolean;
	className?: string;
};

/** Current plan pill plus an Upgrade button for free and trial users. */
export function PlanBadge({ compact = false, className }: PlanBadgeProps) {
	const { sub, isPaid, isTrial, trialDaysLeft, nearLimit, showUpgrade } = useSubscription();
	const openDialog = useDialogStore((state) => state.openDialog);

	if (!sub) return null;

	return (
		<div className={cn("flex shrink-0 items-center gap-2", className)}>
			<Link
				to="/dashboard/settings/billing"
				className={cn(
					"items-center gap-1 rounded-full border px-2.5 py-1 font-medium text-xs transition-colors hover:bg-secondary",
					compact ? "hidden sm:inline-flex" : "inline-flex",
					isPaid && !isTrial && "border-primary/30 bg-primary/10 text-primary",
					isTrial && "border-[#c9a227] bg-[#f5e8bf] text-[#152642]",
					nearLimit && "border-amber-400 text-amber-700",
				)}
			>
				{isPaid && !isTrial && <CrownSimpleIcon weight="fill" aria-hidden="true" className="size-3.5" />}
				{isTrial ? (
					trialDaysLeft !== null ? (
						<Trans id="billing.badge.trialDays">Trial · {trialDaysLeft}d left</Trans>
					) : (
						<Trans id="billing.badge.trial">Trial</Trans>
					)
				) : isPaid ? (
					<Trans id="billing.badge.pro">Pro</Trans>
				) : (
					<Trans id="billing.badge.free">Free plan</Trans>
				)}
			</Link>

			{showUpgrade && (
				<Button
					size="sm"
					onClick={() => openDialog("billing.upgrade", { reason: "badge" })}
					className="gap-1.5 bg-linear-to-r from-primary to-primary/80 font-semibold shadow-sm transition-transform hover:scale-[1.03]"
				>
					<SparkleIcon weight="fill" aria-hidden="true" className="size-4 text-accent" />
					<Trans id="billing.badge.upgrade">Upgrade</Trans>
				</Button>
			)}
		</div>
	);
}
