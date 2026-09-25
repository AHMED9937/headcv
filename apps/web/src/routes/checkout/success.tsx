import type { ReactNode } from "react";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { ORPCError } from "@orpc/client";
import { CheckCircleIcon, CircleNotchIcon, ClockIcon, WarningIcon, XCircleIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import z from "zod";
import { Button } from "@headcv/ui/components/button";
import { client, orpc } from "@/libs/orpc/client";

// Dodo appends ?subscription_id=…&status=… to the return URL. The status is only a UX hint;
// access is granted by the verified webhook or the server-side verification below.
const searchSchema = z.object({ status: z.string().optional().catch(undefined) });

export const Route = createFileRoute("/checkout/success")({
	component: CheckoutSuccess,
	validateSearch: searchSchema,
	head: () => ({
		meta: [{ name: "robots", content: "noindex" }],
	}),
});

type ActivationState = "verifying" | "pending" | "activated" | "delayed" | "not-completed" | "signed-out";

const POLL_INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 10;
const UNSUCCESSFUL_STATUSES = new Set(["failed", "cancelled", "expired"]);

const planLabel = (plan: string) =>
	plan === "trial" ? t`Pro Trial` : plan === "yearly" ? t`Pro Yearly` : t`Pro Monthly`;

function CheckoutSuccess() {
	const { status } = Route.useSearch();
	const queryClient = useQueryClient();
	const paymentUnsuccessful = !!status && UNSUCCESSFUL_STATUSES.has(status);
	const [state, setState] = useState<ActivationState>(paymentUnsuccessful ? "not-completed" : "verifying");
	const [plan, setPlan] = useState("");
	const attempts = useRef(0);
	const timer = useRef<number | undefined>(undefined);

	const verify = useCallback(async () => {
		try {
			const result = await client.billing.verifyAndActivate({});
			if (result.activated) {
				setPlan(result.plan);
				setState("activated");
				// Refresh the plan badge and billing page everywhere.
				void queryClient.invalidateQueries({ queryKey: orpc.billing.getSubscription.key() });
				return;
			}
		} catch (error) {
			if (error instanceof ORPCError && error.code === "UNAUTHORIZED") {
				setState("signed-out");
				return;
			}
		}

		attempts.current += 1;
		if (attempts.current >= MAX_ATTEMPTS) {
			setState("delayed");
			return;
		}
		setState("pending");
		timer.current = window.setTimeout(verify, POLL_INTERVAL_MS);
	}, [queryClient]);

	const checkAgain = useCallback(() => {
		window.clearTimeout(timer.current);
		attempts.current = 0;
		setState("verifying");
		void verify();
	}, [verify]);

	// Start once on mount (verify is stable); later transitions are driven by verify() itself.
	useEffect(() => {
		if (paymentUnsuccessful) return;
		void verify();
		return () => window.clearTimeout(timer.current);
	}, [paymentUnsuccessful, verify]);

	return (
		<main className="flex min-h-svh items-center justify-center px-4">
			<section role="status" aria-live="polite" className="mx-auto max-w-md space-y-6 text-center">
				{(state === "verifying" || state === "pending") && (
					<StatusView
						icon={<CircleNotchIcon className="mx-auto size-16 animate-spin text-primary" aria-hidden="true" />}
						title={
							state === "verifying" ? (
								<Trans id="checkout.verifying.title">Verifying payment...</Trans>
							) : (
								<Trans id="checkout.pending.title">Almost there...</Trans>
							)
						}
						description={
							state === "verifying" ? (
								<Trans id="checkout.verifying.description">
									Please wait while we confirm your payment with our provider.
								</Trans>
							) : (
								<Trans id="checkout.pending.description">
									Your payment is being processed. This usually takes just a few seconds.
								</Trans>
							)
						}
					/>
				)}

				{state === "activated" && (
					<StatusView
						icon={<CheckCircleIcon className="mx-auto size-16 text-green-600" weight="fill" aria-hidden="true" />}
						title={<Trans id="checkout.success.title">Welcome to Pro!</Trans>}
						description={
							<Trans id="checkout.success.plan">
								Your {planLabel(plan)} plan is active. Enjoy unlimited resumes and AI chats!
							</Trans>
						}
						actions={
							<>
								<Button nativeButton={false} render={<Link to="/dashboard" />}>
									<Trans id="checkout.success.dashboard">Go to Dashboard</Trans>
								</Button>
								<BillingButton />
							</>
						}
					/>
				)}

				{state === "delayed" && (
					<StatusView
						icon={<ClockIcon className="mx-auto size-16 text-amber-600" weight="fill" aria-hidden="true" />}
						title={<Trans id="checkout.delayed.title">Still confirming your payment</Trans>}
						description={
							<Trans id="checkout.failed.description">
								We couldn't verify your payment. Don't worry — if you were charged, your subscription will activate
								automatically within a few minutes.
							</Trans>
						}
						actions={
							<>
								<Button onClick={checkAgain}>
									<Trans id="checkout.delayed.retry">Check again</Trans>
								</Button>
								<BillingButton />
							</>
						}
					/>
				)}

				{state === "not-completed" && (
					<StatusView
						icon={<XCircleIcon className="mx-auto size-16 text-destructive" weight="fill" aria-hidden="true" />}
						title={<Trans id="checkout.notCompleted.title">Payment not completed</Trans>}
						description={
							<Trans id="checkout.notCompleted.description">
								Your payment didn't go through, so you haven't been charged. You can choose a plan and try again.
							</Trans>
						}
						actions={
							<>
								<Button nativeButton={false} render={<Link to="/dashboard/settings/billing" />}>
									<Trans id="checkout.notCompleted.plans">See plans</Trans>
								</Button>
								<Button variant="outline" onClick={checkAgain}>
									<Trans id="checkout.delayed.retry">Check again</Trans>
								</Button>
							</>
						}
					/>
				)}

				{state === "signed-out" && (
					<StatusView
						icon={<WarningIcon className="mx-auto size-16 text-amber-600" weight="fill" aria-hidden="true" />}
						title={<Trans id="checkout.signedOut.title">Sign in to finish</Trans>}
						description={
							<Trans id="checkout.signedOut.description">
								Your payment is safe. Sign in to the account you used at checkout and your plan will be there.
							</Trans>
						}
						actions={
							<Button nativeButton={false} render={<Link to="/auth/login" search={{}} />}>
								<Trans id="checkout.signedOut.signIn">Sign in</Trans>
							</Button>
						}
					/>
				)}
			</section>
		</main>
	);
}

function StatusView({
	icon,
	title,
	description,
	actions,
}: {
	icon: ReactNode;
	title: ReactNode;
	description: ReactNode;
	actions?: ReactNode;
}) {
	return (
		<>
			{icon}
			<h1 className="font-bold font-display text-3xl">{title}</h1>
			<p className="text-muted-foreground">{description}</p>
			{actions && <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">{actions}</div>}
		</>
	);
}

function BillingButton() {
	return (
		<Button nativeButton={false} variant="outline" render={<Link to="/dashboard/settings/billing" />}>
			<Trans id="checkout.success.billing">View Billing</Trans>
		</Button>
	);
}
