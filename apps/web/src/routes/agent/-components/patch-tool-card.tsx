import type { UIMessage } from "ai";
import type * as React from "react";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
	ArrowClockwiseIcon,
	CheckIcon,
	CircleNotchIcon,
	ClockCounterClockwiseIcon,
	WarningCircleIcon,
} from "@phosphor-icons/react";
import { Badge } from "@headcv/ui/components/badge";
import { Button } from "@headcv/ui/components/button";

type PatchToolAction = {
	id: string;
	title?: string | null;
	status: string;
	canRollback?: boolean | null;
	revertMessage?: string | null;
};

function toRecord(value: unknown) {
	return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

export function PatchToolCard({
	part,
	action,
	onRevert,
	isReverting,
	onRetry,
	isReadOnly,
}: {
	part: UIMessage["parts"][number];
	action: PatchToolAction | undefined;
	onRevert: (actionId: string) => void;
	isReverting: boolean;
	onRetry?: () => void;
	isReadOnly?: boolean;
}) {
	const partRecord = part as Record<string, unknown>;
	const state = typeof partRecord.state === "string" ? partRecord.state : null;
	const input = toRecord(partRecord.input);
	const output = toRecord(partRecord.output);
	const actionId =
		state === "output-available"
			? (action?.id ?? (typeof output?.actionId === "string" ? output.actionId : null))
			: null;

	const title =
		action?.title ??
		(typeof output?.title === "string" ? output.title : null) ??
		(typeof input?.title === "string" ? input.title : t`Resume patch`);
	const status = action?.status ?? "applied";
	const revertMessage = action?.revertMessage ?? null;
	const errorText = typeof partRecord.errorText === "string" ? partRecord.errorText : null;

	const isFailed = state === "output-error" || state === "output-denied";
	const isPending = !isFailed && state !== "output-available";

	let icon: React.ReactNode;
	let statusBadge: React.ReactNode;
	let message: React.ReactNode;
	let actions: React.ReactNode = null;

	if (isFailed) {
		icon = <WarningCircleIcon className="size-5 text-rose-600" weight="fill" aria-hidden />;
		statusBadge = (
			<Badge className="border-transparent bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200">
				{t`Failed`}
			</Badge>
		);
		message = (
			<div className="space-y-2">
				<p>{t`The AI couldn't apply the changes.`}</p>
				{errorText ? (
					<p className="rounded border border-rose-200 bg-rose-50 p-2 text-rose-900 text-xs dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
						{errorText}
					</p>
				) : null}
			</div>
		);
		if (!isReadOnly && onRetry) {
			actions = (
				<Button size="sm" variant="outline" type="button" className="gap-1.5" onClick={onRetry}>
					<ArrowClockwiseIcon className="size-4" weight="bold" />
					<Trans>Try again</Trans>
				</Button>
			);
		}
	} else if (isPending) {
		icon = <CircleNotchIcon className="size-5 animate-spin text-blue-600" aria-hidden />;
		statusBadge = (
			<Badge className="border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
				{t`Applying`}
			</Badge>
		);
		message = t`The AI is updating your resume…`;
	} else if (status === "rolled_back" || status === "reverted") {
		icon = <ClockCounterClockwiseIcon className="size-5 text-slate-500" aria-hidden />;
		statusBadge = (
			<Badge className="border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
				{t`Restored`}
			</Badge>
		);
		message = revertMessage ? (
			<div className="space-y-1">
				<p>{t`The changes were restored to the previous version.`}</p>
				<p className="text-muted-foreground text-xs">{revertMessage}</p>
			</div>
		) : (
			t`The changes were restored to the previous version.`
		);
	} else if (status === "conflicted") {
		icon = <WarningCircleIcon className="size-5 text-amber-600" weight="fill" aria-hidden />;
		statusBadge = (
			<Badge className="border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
				{t`Conflict`}
			</Badge>
		);
		message = revertMessage ? (
			<div className="space-y-1">
				<p>{t`These changes conflict with a newer edit.`}</p>
				<p className="text-muted-foreground text-xs">{revertMessage}</p>
			</div>
		) : (
			t`These changes conflict with a newer edit.`
		);
	} else {
		icon = <CheckIcon className="size-5 text-green-600" weight="bold" aria-hidden />;
		const isAccepted = status === "accepted";
		statusBadge = (
			<Badge className="border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
				{isAccepted ? t`Saved` : t`Applied`}
			</Badge>
		);
		message = isAccepted
			? t`You kept these changes.`
			: t`The AI updated your resume. Review the changes and keep or restore them.`;

		const canRollback = action?.canRollback ?? (Boolean(actionId) && status === "applied");
		const revertDisabled =
			isReverting || !canRollback || status === "rolled_back" || status === "reverted" || status === "conflicted";
		if (actionId) {
			actions = (
				<Button size="sm" variant="outline" type="button" disabled={revertDisabled} onClick={() => onRevert(actionId)}>
					<ClockCounterClockwiseIcon className="size-4" weight="bold" />
					<Trans>Restore</Trans>
				</Button>
			);
		}
	}

	return (
		<div className="rounded-lg border bg-card p-3 text-sm shadow-sm">
			<div className="flex items-start gap-3">
				<div className="mt-0.5 shrink-0">{icon}</div>
				<div className="min-w-0 flex-1 space-y-2">
					<div className="flex flex-wrap items-center gap-2">
						<p className="font-medium text-foreground">{title}</p>
						{statusBadge}
					</div>
					<div className="text-muted-foreground">{message}</div>
					{actions ? <div className="flex flex-wrap gap-2 pt-1">{actions}</div> : null}
				</div>
			</div>
		</div>
	);
}
