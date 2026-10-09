/**
 * Dodo Payments provider implementation.
 *
 * Uses the official `dodopayments` SDK. Checkout sessions are the only way
 * to create subscriptions (per Dodo best-practices). Webhook verification
 * uses `client.webhooks.unwrap()` on the raw body — never re-serialized JSON.
 */

import type { CheckoutTheme } from "./checkout-theme";
import type {
	CheckoutSessionDetails,
	CheckoutSessionResult,
	CustomerPortalResult,
	LocalizedPricing,
	NormalizedWebhookEvent,
	PaymentProvider,
	SubscriptionInfo,
} from "./provider";
import DodoPayments from "dodopayments";
import { env } from "@headcv/env/server";
import { CHECKOUT_THEME_CONFIG } from "./checkout-theme";
import { getCurrencyForCountry, SUPPORTED_LOCAL_CURRENCIES } from "./country-currency.js";
import { minorToMajor } from "./currency";

// The SDK's preview billing-address/country/currency fields are string-literal unions; derive them
// from the call signature so validated runtime strings can be passed without fragile deep imports.
type PreviewBillingAddress = NonNullable<Parameters<DodoPayments["checkoutSessions"]["preview"]>[0]["billing_address"]>;
type PreviewCurrency = NonNullable<Parameters<DodoPayments["checkoutSessions"]["preview"]>[0]["billing_currency"]>;

// ---------------------------------------------------------------------------
// Plan → Dodo product ID mapping
// ---------------------------------------------------------------------------

/** Thrown for any webhook that fails authentication, so the route can answer 401. */
class WebhookSignatureError extends Error {
	override name = "WebhookSignatureError";
}

/** Maps a Dodo product ID back to our plan; the webhook's product is the source of truth. */
export function getPlanForProductId(productId: string | undefined): "monthly" | "yearly" | "trial" | null {
	if (!productId) return null;
	if (productId === env.DODO_PRODUCT_MONTHLY_ID) return "monthly";
	if (productId === env.DODO_PRODUCT_YEARLY_ID) return "yearly";
	if (productId === env.DODO_PRODUCT_TRIAL_ID) return "trial";
	return null;
}

function getProductId(plan: "monthly" | "yearly" | "trial"): string {
	const map: Record<string, string | undefined> = {
		monthly: env.DODO_PRODUCT_MONTHLY_ID,
		yearly: env.DODO_PRODUCT_YEARLY_ID,
		trial: env.DODO_PRODUCT_TRIAL_ID,
	};
	const id = map[plan];
	if (!id) throw new Error(`No Dodo product ID configured for plan: ${plan}`);
	return id;
}

// ---------------------------------------------------------------------------
// Singleton SDK client
// ---------------------------------------------------------------------------

let _client: DodoPayments | null = null;

function getClient(): DodoPayments {
	if (_client) return _client;

	if (!env.DODO_PAYMENTS_API_KEY) {
		throw new Error("DODO_PAYMENTS_API_KEY is not configured");
	}

	_client = new DodoPayments({
		bearerToken: env.DODO_PAYMENTS_API_KEY,
		environment: env.DODO_PAYMENTS_ENVIRONMENT,
		...(env.DODO_PAYMENTS_WEBHOOK_KEY ? { webhookKey: env.DODO_PAYMENTS_WEBHOOK_KEY } : {}),
	});

	return _client;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export class DodoPaymentsProvider implements PaymentProvider {
	readonly name = "dodo" as const;

	async createCheckoutSession(params: {
		plan: "monthly" | "yearly" | "trial";
		customerEmail: string;
		customerName?: string;
		customerId?: string;
		returnUrl: string;
		metadata?: Record<string, string>;
		theme?: CheckoutTheme;
	}): Promise<CheckoutSessionResult> {
		const client = getClient();
		const productId = getProductId(params.plan);

		// Let Dodo use the customer's browser IP geolocation to pick the currency.
		// This is more accurate than server-side detection, which can be routed through
		// a different country (e.g. Vercel's edge) than the actual user.
		const session = await client.checkoutSessions.create({
			product_cart: [{ product_id: productId, quantity: 1 }],
			customer: {
				email: params.customerEmail,
				...(params.customerName ? { name: params.customerName } : {}),
				...(params.customerId ? { customer_id: params.customerId } : {}),
			},
			return_url: params.returnUrl,
			...(params.metadata ? { metadata: params.metadata } : {}),
			customization: {
				theme: params.theme ?? "light",
				theme_config: CHECKOUT_THEME_CONFIG,
			},
		});

		return {
			checkoutUrl: session.checkout_url ?? "",
			sessionId: session.session_id ?? "",
		};
	}

	async getLocalizedPricing(country: string): Promise<LocalizedPricing | null> {
		const currency = getCurrencyForCountry(country);
		if (!currency || !SUPPORTED_LOCAL_CURRENCIES.has(currency)) return null;

		const productId = env.DODO_PRODUCT_MONTHLY_ID ?? env.DODO_PRODUCT_YEARLY_ID ?? env.DODO_PRODUCT_TRIAL_ID;
		if (!productId) return null;

		try {
			const client = getClient();
			const preview = await client.checkoutSessions.preview({
				product_cart: [{ product_id: productId, quantity: 1 }],
				billing_address: { country } as PreviewBillingAddress,
				billing_currency: currency as PreviewCurrency,
			});

			const item = preview.product_cart?.[0];
			if (!item || item.currency !== currency) return null;

			// `discounted_price` is the list price converted to the local currency (pre-tax);
			// `og_price` is the USD list price. Their ratio is the exact multiplier Dodo applies.
			const local = minorToMajor(item.discounted_price, item.currency);
			const base = minorToMajor(item.og_price, item.og_currency);
			const rate = base > 0 ? local / base : 0;
			if (!Number.isFinite(rate) || rate <= 0) return null;

			// Dodo sometimes returns a foreign currency with a 1:1 "rate" when it cannot
			// actually localize the price. Treat that as "no localization available".
			if (item.currency !== "USD" && rate === 1) return null;

			return { currency: item.currency, rate };
		} catch {
			return null;
		}
	}

	async getCustomerPortalUrl(params: { customerId: string; returnUrl: string }): Promise<CustomerPortalResult> {
		const client = getClient();

		const portalSession = await client.customers.customerPortal.create(params.customerId, {
			return_url: params.returnUrl,
		});

		return { portalUrl: portalSession.link };
	}

	verifyWebhook(params: { rawBody: string; headers: Record<string, string> }): NormalizedWebhookEvent {
		const client = getClient();

		const webhookId = params.headers["webhook-id"];
		if (!webhookId) {
			throw new WebhookSignatureError("Missing webhook-id header");
		}

		// unwrap() verifies the Standard Webhooks signature (and timestamp freshness)
		// and parses the payload. Any failure is an authentication failure.
		let event: unknown;
		try {
			event = client.webhooks.unwrap(params.rawBody, {
				headers: {
					"webhook-id": webhookId,
					"webhook-signature": params.headers["webhook-signature"] ?? "",
					"webhook-timestamp": params.headers["webhook-timestamp"] ?? "",
				},
			});
		} catch (error) {
			throw new WebhookSignatureError(error instanceof Error ? error.message : "Invalid webhook signature");
		}

		const eventObj = event as unknown as Record<string, unknown>;

		return {
			webhookId,
			eventType: eventObj.type as string,
			data: (eventObj.data as Record<string, unknown>) ?? {},
		};
	}

	async getSubscription(subscriptionId: string): Promise<SubscriptionInfo | null> {
		try {
			const client = getClient();
			const sub = await client.subscriptions.retrieve(subscriptionId);

			return {
				providerSubscriptionId: sub.subscription_id,
				status: sub.status,
				plan: "unknown", // resolved from local DB; Dodo doesn't expose our plan slug
				currentPeriodStart: sub.created_at ? new Date(sub.created_at) : null,
				currentPeriodEnd: sub.next_billing_date ? new Date(sub.next_billing_date) : null,
				cancelAtPeriodEnd: false,
			};
		} catch {
			return null;
		}
	}

	async getCheckoutSession(sessionId: string): Promise<CheckoutSessionDetails | null> {
		try {
			const client = getClient();
			const session = await client.checkoutSessions.retrieve(sessionId);

			let customerId: string | null = null;
			let subscriptionId: string | null = null;

			// If payment exists, retrieve it to get customer_id and subscription_id
			if (session.payment_id && session.payment_status === "succeeded") {
				try {
					const payment = await client.payments.retrieve(session.payment_id);
					customerId = payment.customer?.customer_id ?? null;
					subscriptionId = payment.subscription_id ?? null;
				} catch {
					// payment retrieval failed — proceed with session-level data
				}
			}

			return {
				sessionId: session.id,
				paymentStatus: session.payment_status ?? null,
				customerId,
				subscriptionId,
			};
		} catch {
			return null;
		}
	}
}
