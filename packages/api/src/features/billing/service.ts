/**
 * Billing & Entitlement service.
 *
 * billingService  — manages subscription rows and webhook processing
 * entitlementService — resume allowance and AI chat quotas
 */

import { count, eq, sql } from "drizzle-orm";
import { db } from "@headcv/db/client";
import { resume, userSubscription, userUsage, webhookEventLog } from "@headcv/db/schema";

// ---------------------------------------------------------------------------
// Plan limits
// ---------------------------------------------------------------------------

export type PlanSlug = "free" | "trial" | "monthly" | "yearly";

interface PlanLimits {
	resumes: number; // resumes owned at once; -1 = unlimited
	aiChats: number; // -1 = unlimited
}

const PLAN_LIMITS: Record<PlanSlug, PlanLimits> = {
	free: { resumes: 3, aiChats: 1 },
	trial: { resumes: -1, aiChats: -1 },
	monthly: { resumes: -1, aiChats: -1 },
	yearly: { resumes: -1, aiChats: -1 },
};

/** Shared by every resume-creating path; the web client maps "resume limit" to its upgrade prompt. */
export const RESUME_LIMIT_MESSAGE = "Free plan resume limit reached. Upgrade your plan for unlimited resumes.";

export function getPlanLimits(plan: string): PlanLimits {
	return PLAN_LIMITS[plan as PlanSlug] ?? PLAN_LIMITS.free;
}

/**
 * Determine effective access level for a subscription.
 * Handles edge cases: expired periods, cancelled-but-active, on_hold, etc.
 */
/** Renewal webhooks land after the charge; keep paid access this long past the period end. */
const RENEWAL_GRACE_MS = 24 * 60 * 60 * 1000;

export function getEffectiveAccess(sub: {
	plan: string;
	status: string;
	cancelAtPeriodEnd: boolean;
	currentPeriodEnd: Date | null;
}): "paid" | "free" {
	if (sub.status === "active") {
		// Defensive: if the period ended and no renewal webhook arrived within the grace window, treat as free.
		if (sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() + RENEWAL_GRACE_MS < Date.now()) return "free";
		return sub.plan !== "free" ? "paid" : "free";
	}

	// Cancelled but still within paid period
	if (sub.status === "cancelled" && sub.cancelAtPeriodEnd) {
		if (sub.currentPeriodEnd && sub.currentPeriodEnd > new Date()) return "paid";
		return "free";
	}

	// on_hold, failed, expired, pending — all get free access
	return "free";
}

/** The trial is once per user: blocked after any recorded or current trial. */
export function hasUsedTrial(sub: { plan: string; trialUsedAt: Date | null }): boolean {
	return sub.trialUsedAt !== null || sub.plan === "trial";
}

// ---------------------------------------------------------------------------
// billingService
// ---------------------------------------------------------------------------

export const billingService = {
	/** Get or create a subscription row for the user (defaults to free). */
	async getSubscription(userId: string) {
		const [existing] = await db.select().from(userSubscription).where(eq(userSubscription.userId, userId)).limit(1);
		if (existing) return existing;

		// Auto-create a free subscription row so every user has one
		const [created] = await db
			.insert(userSubscription)
			.values({ userId, plan: "free", status: "active", provider: "dodo" })
			.onConflictDoNothing({ target: userSubscription.userId })
			.returning();

		// Race: another request already inserted — re-read
		if (!created) {
			const [raced] = await db.select().from(userSubscription).where(eq(userSubscription.userId, userId)).limit(1);
			if (!raced) throw new Error(`Failed to read subscription for user ${userId}`);
			return raced;
		}

		return created;
	},

	/** Upsert subscription state from a verified webhook event. */
	async upsertSubscription(params: {
		userId: string;
		provider: string;
		providerCustomerId: string | null;
		providerSubscriptionId: string;
		plan: PlanSlug;
		status: string;
		currentPeriodStart: Date | null;
		currentPeriodEnd: Date | null;
		cancelAtPeriodEnd: boolean;
		metadata?: Record<string, unknown>;
	}) {
		const [row] = await db
			.insert(userSubscription)
			.values({
				userId: params.userId,
				provider: params.provider,
				providerCustomerId: params.providerCustomerId,
				providerSubscriptionId: params.providerSubscriptionId,
				plan: params.plan,
				status: params.status,
				currentPeriodStart: params.currentPeriodStart,
				currentPeriodEnd: params.currentPeriodEnd,
				cancelAtPeriodEnd: params.cancelAtPeriodEnd,
				metadata: params.metadata ?? null,
				trialUsedAt: params.plan === "trial" ? new Date() : null,
			})
			.onConflictDoUpdate({
				target: userSubscription.userId,
				set: {
					provider: params.provider,
					providerCustomerId: params.providerCustomerId,
					providerSubscriptionId: params.providerSubscriptionId,
					plan: params.plan,
					status: params.status,
					currentPeriodStart: params.currentPeriodStart,
					currentPeriodEnd: params.currentPeriodEnd,
					cancelAtPeriodEnd: params.cancelAtPeriodEnd,
					metadata: params.metadata ?? null,
					...(params.plan === "trial" && {
						trialUsedAt: sql`coalesce(${userSubscription.trialUsedAt}, now())`,
					}),
				},
			})
			.returning();

		return row;
	},

	/** Find the local userId that owns a given provider subscription. */
	async findUserByProviderSubscription(providerSubscriptionId: string): Promise<string | null> {
		const [row] = await db
			.select({ userId: userSubscription.userId })
			.from(userSubscription)
			.where(eq(userSubscription.providerSubscriptionId, providerSubscriptionId))
			.limit(1);
		return row?.userId ?? null;
	},

	/** Find the local userId by provider customer ID. */
	async findUserByProviderCustomer(providerCustomerId: string): Promise<string | null> {
		const [row] = await db
			.select({ userId: userSubscription.userId })
			.from(userSubscription)
			.where(eq(userSubscription.providerCustomerId, providerCustomerId))
			.limit(1);
		return row?.userId ?? null;
	},

	/**
	 * Claim a webhook event ID atomically (idempotency).
	 * Returns true if newly claimed, false if already processed.
	 */
	async claimWebhookEvent(webhookId: string, provider: string, eventType: string): Promise<boolean> {
		const result = await db
			.insert(webhookEventLog)
			.values({ webhookId, provider, eventType })
			.onConflictDoNothing({ target: webhookEventLog.webhookId });

		// rowCount === 0 means the unique constraint prevented the insert (duplicate)
		return (result.rowCount ?? 0) > 0;
	},

	/** Undo a claim when processing failed, so Dodo's retry is processed instead of skipped. */
	async releaseWebhookEvent(webhookId: string) {
		await db.delete(webhookEventLog).where(eq(webhookEventLog.webhookId, webhookId));
	},
};

// ---------------------------------------------------------------------------
// entitlementService
// ---------------------------------------------------------------------------

export const entitlementService = {
	/** Ensure a usage row exists for the user. */
	async ensureUsage(userId: string) {
		await db.insert(userUsage).values({ userId }).onConflictDoNothing({ target: userUsage.userId });
	},

	/** Get current usage counters. */
	async getUsage(userId: string) {
		await this.ensureUsage(userId);
		const [row] = await db.select().from(userUsage).where(eq(userUsage.userId, userId)).limit(1);
		if (!row) throw new Error(`Failed to read usage for user ${userId}`);
		return row;
	},

	/** Number of resumes the user currently owns (deleting one frees a slot). */
	async countResumes(userId: string): Promise<number> {
		const [row] = await db.select({ count: count() }).from(resume).where(eq(resume.userId, userId));
		return row?.count ?? 0;
	},

	/** Returns the user's resume limit (-1 = unlimited) and whether another resume fits. */
	async getResumeAllowance(userId: string) {
		const sub = await billingService.getSubscription(userId);
		const limits = getEffectiveAccess(sub) === "paid" ? getPlanLimits(sub.plan) : PLAN_LIMITS.free;
		const used = await this.countResumes(userId);
		return { used, limit: limits.resumes, canCreate: limits.resumes === -1 || used < limits.resumes };
	},

	/** Check if the user can start an AI chat. */
	async canUseAiChat(userId: string): Promise<boolean> {
		const sub = await billingService.getSubscription(userId);
		const access = getEffectiveAccess(sub);
		const limits = access === "paid" ? getPlanLimits(sub.plan) : PLAN_LIMITS.free;
		if (limits.aiChats === -1) return true;

		const usage = await this.getUsage(userId);
		return usage.aiChatsUsed < limits.aiChats;
	},

	/**
	 * Atomically reserve one AI chat credit.
	 * Uses a SQL WHERE guard so concurrent requests cannot exceed the limit.
	 */
	async reserveAiChat(userId: string): Promise<boolean> {
		const sub = await billingService.getSubscription(userId);
		const access = getEffectiveAccess(sub);
		const limits = access === "paid" ? getPlanLimits(sub.plan) : PLAN_LIMITS.free;
		if (limits.aiChats === -1) return true;

		await this.ensureUsage(userId);

		const result = await db
			.update(userUsage)
			.set({ aiChatsUsed: sql`${userUsage.aiChatsUsed} + 1` })
			.where(sql`${userUsage.userId} = ${userId} AND ${userUsage.aiChatsUsed} < ${limits.aiChats}`);

		return (result.rowCount ?? 0) > 0;
	},

	/** Reset usage counters (called on subscription renewal). */
	async resetUsage(userId: string) {
		await db
			.update(userUsage)
			.set({ resumeUploadsUsed: 0, aiChatsUsed: 0, resetAt: new Date() })
			.where(eq(userUsage.userId, userId));
	},
};
