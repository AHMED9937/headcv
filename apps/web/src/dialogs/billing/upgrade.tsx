import type { DialogProps } from "../store";
import { Trans } from "@lingui/react/macro";
import { Link } from "@tanstack/react-router";
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@headcv/ui/components/dialog";
import { PlanPicker } from "@/features/billing/plan-picker";
import { useSubscription } from "@/features/billing/use-subscription";
import { useDialogStore } from "../store";

export function UpgradeDialog({ data }: DialogProps<"billing.upgrade">) {
	const { sub, trialEligible } = useSubscription();
	const closeDialog = useDialogStore((state) => state.closeDialog);

	return (
		<DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
			<DialogHeader>
				<DialogTitle className="font-display text-2xl">
					{data.reason === "ai-limit" ? (
						<Trans id="billing.upgrade.aiLimit.title">You've used all your free AI chats</Trans>
					) : data.reason === "resume-limit" ? (
						<Trans id="billing.upgrade.resumeLimit.title">You've created all your free resumes</Trans>
					) : (
						<Trans id="billing.upgrade.badge.title">Land your next job faster with Pro</Trans>
					)}
				</DialogTitle>
				<DialogDescription>
					{data.reason === "ai-limit" && sub ? (
						<Trans id="billing.upgrade.aiLimit.description">
							{sub.usage.aiChatsUsed} of {sub.usage.aiChatsLimit} AI chats used. Keep your momentum — Pro gives you
							unlimited AI help on every draft.
						</Trans>
					) : data.reason === "resume-limit" && sub ? (
						<Trans id="billing.upgrade.resumeLimit.description">
							{sub.usage.resumesUsed} of {sub.usage.resumesLimit} free resumes used. Tailor a resume to every job you
							apply for — Pro removes the limit.
						</Trans>
					) : (
						<Trans id="billing.upgrade.badge.description">
							Unlimited resumes, cover letters, imports and AI assistance — tailored to every application.
						</Trans>
					)}
				</DialogDescription>
			</DialogHeader>

			<PlanPicker hideTrial={!trialEligible} />

			<Link
				to="/dashboard/settings/billing"
				onClick={closeDialog}
				className="text-center text-muted-foreground text-sm underline-offset-4 hover:underline"
			>
				<Trans id="billing.upgrade.manageLink">View my plan and usage</Trans>
			</Link>
		</DialogContent>
	);
}
