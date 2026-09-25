/**
 * Payment Provider Abstraction (Factory Pattern)
 *
 * Normalizes operations across Dodo Payments (global) and EPAY (Egypt).
 * Feature code consumes these interfaces — never provider-specific APIs directly.
 */

import type { CheckoutTheme } from "./checkout-theme";

// ---------------------------------------------------------------------------
// Normalized types
// ---------------------------------------------------------------------------

export interface CheckoutSessionResult {
	checkoutUrl: string;
	sessionId: string;
}

export interface NormalizedWebhookEvent {
	webhookId: string;
	eventType: string;
	data: Record<string, unknown>;
}

export interface CustomerPortalResult {
	portalUrl: string;
}

export interface SubscriptionInfo {
	providerSubscriptionId: string;
	status: string;
	plan: string;
	currentPeriodStart: Date | null;
	currentPeriodEnd: Date | null;
	cancelAtPeriodEnd: boolean;
}

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

export interface PaymentProvider {
	readonly name: "dodo" | "epay";

	createCheckoutSession(params: {
		plan: "monthly" | "yearly" | "trial";
		customerEmail: string;
		customerName?: string;
		customerId?: string;
		returnUrl: string;
		metadata?: Record<string, string>;
		/** The app theme the user is on, so hosted checkout can match it. */
		theme?: CheckoutTheme;
	}): Promise<CheckoutSessionResult>;

	getCustomerPortalUrl(params: { customerId: string; returnUrl: string }): Promise<CustomerPortalResult>;

	verifyWebhook(params: { rawBody: string; headers: Record<string, string> }): NormalizedWebhookEvent;

	getSubscription(subscriptionId: string): Promise<SubscriptionInfo | null>;

	/** Retrieve a checkout session status and payment details from the provider. */
	getCheckoutSession(sessionId: string): Promise<CheckoutSessionDetails | null>;
}

export interface CheckoutSessionDetails {
	sessionId: string;
	paymentStatus: string | null;
	customerId: string | null;
	subscriptionId: string | null;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

import { DodoPaymentsProvider } from "./dodo-provider.js";
import { EpayPaymentsProvider } from "./epay-provider.js";

const providerCache = new Map<string, PaymentProvider>();

function createProvider(key: string): PaymentProvider {
	switch (key) {
		case "dodo":
			return new DodoPaymentsProvider();
		case "epay":
			return new EpayPaymentsProvider();
		default:
			throw new Error(`Unknown payment provider: ${key}`);
	}
}

export function getPaymentProvider(country?: string): PaymentProvider {
	const key = country?.toUpperCase() === "EG" ? "epay" : "dodo";

	const cached = providerCache.get(key);
	if (cached) return cached;

	const provider = createProvider(key);
	providerCache.set(key, provider);
	return provider;
}
