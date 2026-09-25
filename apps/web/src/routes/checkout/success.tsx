import { Trans } from "@lingui/react/macro";
import { CheckCircleIcon, CircleNotchIcon, WarningIcon } from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@headcv/ui/components/button";
import { client } from "@/libs/orpc/client";

export const Route = createFileRoute("/checkout/success")({
	component: CheckoutSuccess,
	head: () => ({
		meta: [{ name: "robots", content: "noindex" }],
	}),
});

type ActivationState = "verifying" | "activated" | "pending" | "failed";

function CheckoutSuccess() {
	const [state, setState] = useState<ActivationState>("verifying");
	const [plan, setPlan] = useState<string>("");
	const retryCount = useRef(0);
	const maxRetries = 10;

	const verify = useCallback(async () => {
		try {
			const result = await client.billing.verifyAndActivate();
			if (result.activated) {
				setState("activated");
				setPlan(result.plan);
			} else if (retryCount.current < maxRetries) {
				retryCount.current++;
				setState("pending");
				setTimeout(verify, 3000);
			} else {
				setState("failed");
			}
		} catch {
			if (retryCount.current < maxRetries) {
				retryCount.current++;
				setState("pending");
				setTimeout(verify, 3000);
			} else {
				setState("failed");
			}
		}
	}, []);

	useEffect(() => {
		verify();
	}, [verify]);

	return (
		<div className="flex min-h-screen items-center justify-center px-4">
			<div className="mx-auto max-w-md space-y-6 text-center">
				{state === "verifying" && (
					<>
						<CircleNotchIcon className="mx-auto size-16 animate-spin text-primary" />
						<h1 className="font-bold font-display text-3xl">
							<Trans id="checkout.verifying.title">Verifying payment...</Trans>
						</h1>
						<p className="text-muted-foreground">
							<Trans id="checkout.verifying.description">
								Please wait while we confirm your payment with our provider.
							</Trans>
						</p>
					</>
				)}
				{state === "pending" && (
					<>
						<CircleNotchIcon className="mx-auto size-16 animate-spin text-primary" />
						<h1 className="font-bold font-display text-3xl">
							<Trans id="checkout.pending.title">Almost there...</Trans>
						</h1>
						<p className="text-muted-foreground">
							<Trans id="checkout.pending.description">
								Your payment is being processed. This usually takes just a few seconds.
							</Trans>
						</p>
					</>
				)}
				{state === "activated" && (
					<>
						<CheckCircleIcon className="mx-auto size-16 text-green-500" weight="fill" />
						<h1 className="font-bold font-display text-3xl">
							<Trans id="checkout.success.title">Welcome to Pro!</Trans>
						</h1>
						<p className="text-muted-foreground">
							<Trans id="checkout.success.description">
								Your {plan} subscription is now active. Enjoy unlimited resumes and AI chats!
							</Trans>
						</p>
						<div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
							<Button nativeButton={false} render={<Link to="/dashboard" />}>
								<Trans id="checkout.success.dashboard">Go to Dashboard</Trans>
							</Button>
							<Button nativeButton={false} variant="outline" render={<Link to="/dashboard/settings/billing" />}>
								<Trans id="checkout.success.billing">View Billing</Trans>
							</Button>
						</div>
					</>
				)}
				{state === "failed" && (
					<>
						<WarningIcon className="mx-auto size-16 text-amber-500" weight="fill" />
						<h1 className="font-bold font-display text-3xl">
							<Trans id="checkout.failed.title">Something went wrong</Trans>
						</h1>
						<p className="text-muted-foreground">
							<Trans id="checkout.failed.description">
								We couldn't verify your payment. Don't worry — if you were charged, your subscription will activate
								automatically within a few minutes.
							</Trans>
						</p>
						<div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
							<Button
								onClick={() => {
									retryCount.current = 0;
									setState("verifying");
									verify();
								}}
							>
								<Trans id="checkout.failed.retry">Try Again</Trans>
							</Button>
							<Button nativeButton={false} variant="outline" render={<Link to="/dashboard/settings/billing" />}>
								<Trans id="checkout.failed.billing">View Billing</Trans>
							</Button>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
