/**
 * EPAY provider stub (Egypt-only).
 *
 * This provider is not yet implemented. All methods throw a clear error
 * directing callers to the Dodo provider. The factory routes Egypt users
 * here, but real integration requires EPAY API docs and credentials.
 */

import type {
	CheckoutSessionDetails,
	CheckoutSessionParams,
	CheckoutSessionResult,
	CustomerPortalResult,
	NormalizedWebhookEvent,
	PaymentProvider,
	SubscriptionInfo,
} from "./provider";

function notImplemented(): never {
	throw new Error("EPAY provider is not yet implemented. Egypt payment integration is coming soon.");
}

export class EpayPaymentsProvider implements PaymentProvider {
	readonly name = "epay" as const;

	createCheckoutSession(_params: CheckoutSessionParams): Promise<CheckoutSessionResult> {
		notImplemented();
	}

	getCustomerPortalUrl(_params: { customerId: string; returnUrl: string }): Promise<CustomerPortalResult> {
		notImplemented();
	}

	verifyWebhook(_params: { rawBody: string; headers: Record<string, string> }): NormalizedWebhookEvent {
		notImplemented();
	}

	getSubscription(_subscriptionId: string): Promise<SubscriptionInfo | null> {
		notImplemented();
	}

	getCheckoutSession(_sessionId: string): Promise<CheckoutSessionDetails | null> {
		notImplemented();
	}
}
