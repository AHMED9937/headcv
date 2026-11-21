/**
 * Dodo Payments webhook handler.
 *
 * Mounted as a raw Hono route at POST /api/webhooks/dodo in apps/server.
 * This handler:
 *   1. Reads the raw body (never re-serialized)
 *   2. Verifies the Standard Webhooks signature via the Dodo SDK
 *   3. Claims the webhook-id for idempotency
 *   4. Processes subscription lifecycle events
 *   5. Responds 200 immediately (within 15s timeout)
 *
 * If fulfillment throws, the idempotency claim is released and the route
 * answers 500, so Dodo's retry is processed instead of skipped as a duplicate.
 * Events can arrive out of order; each payload carries the subscription's
 * latest state, which the handlers check before granting access.
 */

import type { PlanSlug } from "./service";
import { and, eq } from "drizzle-orm";
import { db } from "@headcv/db/client";
import { user, userSubscription } from "@headcv/db/schema";
import { getPlanForProductId } from "./dodo-provider";
import { getPaymentProvider } from "./provider.js";
import { billingService, entitlementService, getEffectiveAccess } from "./service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DodoSubscriptionData {
	subscription_id?: string;
	customer?: { customer_id?: string; email?: string };
	product_id?: string;
	status?: string;
	created_at?: string;
	next_billing_date?: string;
	cancel_at_next_billing_date?: boolean;
	trial_period_days?: number;
	metadata?: Record<string, unknown>;
	[key: string]: unknown;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Plan resolution
// ---------------------------------------------------------------------------

/**
 * The subscribed product decides the plan (this also covers portal plan changes).
 * The checkout's pending plan and the stored plan are fallbacks for unknown products.
 */
export function resolvePlan(data: DodoSubscriptionData, pendingPlan?: string, storedPlan?: string): PlanSlug {
	const fromProduct = getPlanForProductId(data.product_id);
	if (fromProduct) return fromProduct;
	if (pendingPlan && pendingPlan !== "free") return pendingPlan as PlanSlug;
	if (storedPlan && storedPlan !== "free") return storedPlan as PlanSlug;
	return "monthly";
}

/**
 * The trial a subscription opened with. Derived from its creation time, not `next_billing_date`, because
 * Dodo keeps `trial_period_days` on the subscription for life: every later event must yield the same end.
 */
function getTrial(data: DodoSubscriptionData): { endsAt: Date | null } | undefined {
	const days = data.trial_period_days ?? 0;
	if (!(days > 0)) return undefined;
	const start = data.created_at ? Date.parse(data.created_at) : Number.NaN;
	return { endsAt: Number.isNaN(start) ? null : new Date(start + days * DAY_MS) };
}

/** A late `active`/`renewed` must not re-grant access to a subscription that has since ended. */
function isNoLongerActive(data: DodoSubscriptionData, eventType: string): boolean {
	if (!data.status || data.status === "active") return false;
	console.warn(`[billing-webhook] ${eventType} skipped: subscription ${data.subscription_id} is now ${data.status}`);
	return true;
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function findUserForSubscriptionEvent(data: DodoSubscriptionData): Promise<string | null> {
	const customerId = data.customer?.customer_id;
	const subscriptionId = data.subscription_id;

	// 1. Find by provider customer ID
	if (customerId) {
		const userId = await billingService.findUserByProviderCustomer(customerId);
		if (userId) return userId;
	}

	// 2. Find by provider subscription ID
	if (subscriptionId) {
		const userId = await billingService.findUserByProviderSubscription(subscriptionId);
		if (userId) return userId;
	}

	// 3. Find by Dodo metadata.userId (passed during checkout creation)
	const webhookMeta = data.metadata as Record<string, unknown> | undefined;
	if (webhookMeta?.userId && typeof webhookMeta.userId === "string") {
		return webhookMeta.userId;
	}

	// 4. Last resort: the account with this exact email that has a checkout pending.
	if (data.customer?.email) {
		const [row] = await db
			.select({ userId: userSubscription.userId })
			.from(userSubscription)
			.innerJoin(user, eq(user.id, userSubscription.userId))
			.where(and(eq(user.email, data.customer.email.toLowerCase()), eq(userSubscription.status, "pending")))
			.limit(1);
		if (row) return row.userId;
		console.warn(`[billing-webhook] no pending checkout matches subscription ${subscriptionId}`);
	}

	return null;
}

async function handleSubscriptionActive(data: DodoSubscriptionData, eventType = "subscription.active") {
	const customerId = data.customer?.customer_id;
	const subscriptionId = data.subscription_id;
	if (!subscriptionId || isNoLongerActive(data, eventType)) return;

	const userId = await findUserForSubscriptionEvent(data);
	if (!userId) {
		// Someone paid and we can't match them: fail loudly so Dodo retries and the delivery shows as failed.
		throw new Error(`[billing-webhook] ${eventType}: cannot find user for subscription ${subscriptionId}`);
	}

	const existingSub = await billingService.getSubscription(userId);

	// The user is paying through another subscription (e.g. a leftover $3 weekly trial still winding down, which
	// is matched by customer ID). Replacing the row would orphan the paid plan and later downgrade the user.
	if (
		existingSub.providerSubscriptionId &&
		existingSub.providerSubscriptionId !== subscriptionId &&
		getEffectiveAccess(existingSub) === "paid"
	) {
		console.error(
			`[billing-webhook] ${eventType} ignored: user ${userId} pays via ${existingSub.providerSubscriptionId}, not ${subscriptionId}`,
		);
		return;
	}

	// Resolve plan from pending metadata
	const pendingPlan =
		existingSub.metadata && typeof existingSub.metadata === "object"
			? ((existingSub.metadata as Record<string, unknown>).pendingPlan as string | undefined)
			: undefined;

	const plan = resolvePlan(data, pendingPlan, existingSub.plan);

	await billingService.upsertSubscription({
		userId,
		provider: "dodo",
		providerCustomerId: customerId ?? null,
		providerSubscriptionId: subscriptionId,
		plan,
		status: "active",
		currentPeriodStart: data.created_at ? new Date(data.created_at) : new Date(),
		currentPeriodEnd: data.next_billing_date ? new Date(data.next_billing_date) : null,
		cancelAtPeriodEnd: data.cancel_at_next_billing_date ?? false,
		metadata: data,
		trial: getTrial(data),
	});

	// Reset usage counters on activation
	await entitlementService.resetUsage(userId);
}

async function handleSubscriptionRenewed(data: DodoSubscriptionData) {
	const subscriptionId = data.subscription_id;
	if (!subscriptionId || isNoLongerActive(data, "subscription.renewed")) return;

	const userId = await billingService.findUserByProviderSubscription(subscriptionId);
	if (!userId) return;

	const existingSub = await billingService.getSubscription(userId);

	await billingService.upsertSubscription({
		userId,
		provider: "dodo",
		providerCustomerId: data.customer?.customer_id ?? existingSub.providerCustomerId,
		providerSubscriptionId: subscriptionId,
		plan: resolvePlan(data, undefined, existingSub.plan),
		status: "active",
		currentPeriodStart: new Date(),
		currentPeriodEnd: data.next_billing_date ? new Date(data.next_billing_date) : null,
		cancelAtPeriodEnd: data.cancel_at_next_billing_date ?? false,
		metadata: data,
	});

	// Reset usage counters on renewal
	await entitlementService.resetUsage(userId);
}

async function handleSubscriptionCancelled(data: DodoSubscriptionData) {
	const subscriptionId = data.subscription_id;
	if (!subscriptionId) return;

	const userId = await billingService.findUserByProviderSubscription(subscriptionId);
	if (!userId) return;

	const existingSub = await billingService.getSubscription(userId);
	const cancelAtPeriodEnd = data.cancel_at_next_billing_date ?? false;

	await billingService.upsertSubscription({
		userId,
		provider: "dodo",
		providerCustomerId: data.customer?.customer_id ?? existingSub.providerCustomerId,
		providerSubscriptionId: subscriptionId,
		plan: cancelAtPeriodEnd ? (existingSub.plan as PlanSlug) : "free",
		status: cancelAtPeriodEnd ? "cancelled" : "expired",
		currentPeriodStart: existingSub.currentPeriodStart,
		currentPeriodEnd: data.next_billing_date ? new Date(data.next_billing_date) : existingSub.currentPeriodEnd,
		cancelAtPeriodEnd,
		metadata: data,
	});
}

async function handleSubscriptionExpired(data: DodoSubscriptionData) {
	const subscriptionId = data.subscription_id;
	if (!subscriptionId) return;

	const userId = await billingService.findUserByProviderSubscription(subscriptionId);
	if (!userId) return;

	await billingService.upsertSubscription({
		userId,
		provider: "dodo",
		providerCustomerId: data.customer?.customer_id ?? null,
		providerSubscriptionId: subscriptionId,
		plan: "free",
		status: "expired",
		currentPeriodStart: null,
		currentPeriodEnd: null,
		cancelAtPeriodEnd: false,
		metadata: data,
	});
}

async function handleSubscriptionOnHold(data: DodoSubscriptionData) {
	const subscriptionId = data.subscription_id;
	if (!subscriptionId) return;

	const userId = await billingService.findUserByProviderSubscription(subscriptionId);
	if (!userId) return;

	const existingSub = await billingService.getSubscription(userId);

	await billingService.upsertSubscription({
		userId,
		provider: "dodo",
		providerCustomerId: data.customer?.customer_id ?? existingSub.providerCustomerId,
		providerSubscriptionId: subscriptionId,
		plan: existingSub.plan as PlanSlug,
		status: "on_hold",
		currentPeriodStart: existingSub.currentPeriodStart,
		currentPeriodEnd: existingSub.currentPeriodEnd,
		cancelAtPeriodEnd: existingSub.cancelAtPeriodEnd,
		metadata: data,
	});
}

async function handleSubscriptionFailed(data: DodoSubscriptionData) {
	const subscriptionId = data.subscription_id;
	if (!subscriptionId) return;

	const userId = await billingService.findUserByProviderSubscription(subscriptionId);
	if (!userId) return;

	await billingService.upsertSubscription({
		userId,
		provider: "dodo",
		providerCustomerId: data.customer?.customer_id ?? null,
		providerSubscriptionId: subscriptionId,
		plan: "free",
		status: "failed",
		currentPeriodStart: null,
		currentPeriodEnd: null,
		cancelAtPeriodEnd: false,
		metadata: data,
	});
}

/**
 * Catch-all sync for a live subscription, e.g. "cancel at period end" scheduled in the portal.
 * Status transitions are left to their dedicated events; this only refreshes an active row.
 */
async function handleSubscriptionUpdated(data: DodoSubscriptionData) {
	const subscriptionId = data.subscription_id;
	if (!subscriptionId || data.status !== "active") return;

	const userId = await billingService.findUserByProviderSubscription(subscriptionId);
	if (!userId) return;

	const existingSub = await billingService.getSubscription(userId);
	if (existingSub.status !== "active" && existingSub.status !== "cancelled") return;

	const cancelAtPeriodEnd = data.cancel_at_next_billing_date ?? false;

	await billingService.upsertSubscription({
		userId,
		provider: "dodo",
		providerCustomerId: data.customer?.customer_id ?? existingSub.providerCustomerId,
		providerSubscriptionId: subscriptionId,
		plan: resolvePlan(data, undefined, existingSub.plan),
		// A scheduled cancellation keeps access until the period ends; undoing it restores "active".
		status: cancelAtPeriodEnd ? "cancelled" : "active",
		currentPeriodStart: existingSub.currentPeriodStart,
		currentPeriodEnd: data.next_billing_date ? new Date(data.next_billing_date) : existingSub.currentPeriodEnd,
		cancelAtPeriodEnd,
		metadata: data,
	});
}

// ---------------------------------------------------------------------------
// Main webhook processor — called from Hono route in apps/server
// ---------------------------------------------------------------------------

export async function processDodoWebhook(rawBody: string, headers: Record<string, string>): Promise<void> {
	const provider = getPaymentProvider(); // default = Dodo

	// 1. Verify signature — throws if invalid
	const event = provider.verifyWebhook({ rawBody, headers });

	// 2. Idempotency: claim the webhook-id
	const claimed = await billingService.claimWebhookEvent(event.webhookId, "dodo", event.eventType);
	if (!claimed) return; // already processed

	// 3. Route by event type. On failure, release the claim so Dodo's retry isn't skipped as a duplicate.
	try {
		await routeEvent(event.eventType, event.data as DodoSubscriptionData);
	} catch (error) {
		await billingService.releaseWebhookEvent(event.webhookId);
		throw error;
	}
}

async function routeEvent(eventType: string, data: DodoSubscriptionData) {
	switch (eventType) {
		case "subscription.active":
			await handleSubscriptionActive(data);
			break;
		case "subscription.renewed":
			await handleSubscriptionRenewed(data);
			break;
		case "subscription.updated":
			await handleSubscriptionUpdated(data);
			break;
		case "subscription.cancelled":
			await handleSubscriptionCancelled(data);
			break;
		case "subscription.expired":
			await handleSubscriptionExpired(data);
			break;
		case "subscription.on_hold":
			await handleSubscriptionOnHold(data);
			break;
		case "subscription.failed":
			await handleSubscriptionFailed(data);
			break;
		case "subscription.plan_changed":
			// The new product decides the plan.
			await handleSubscriptionActive(data, eventType);
			break;
		case "dispute.opened":
			// Chargeback: needs a human. Logged at error level so log alerts pick it up.
			console.error(
				`[billing-webhook] DISPUTE OPENED dispute=${String(data.dispute_id)} payment=${String(data.payment_id)}`,
			);
			break;
		default:
			// Log but don't error on unhandled events
			console.log(`[billing-webhook] unhandled event: ${eventType}`);
	}
}
