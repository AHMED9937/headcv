import * as pg from "drizzle-orm/pg-core";
import { generateId } from "@headcv/utils/string";
import { user } from "./auth";

/**
 * Tracks the user's active subscription from any payment provider.
 * One row per user — upserted on webhook events.
 */
export const userSubscription = pg.pgTable(
	"user_subscription",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		userId: pg
			.text("user_id")
			.notNull()
			.unique()
			.references(() => user.id, { onDelete: "cascade" }),

		// Provider identification
		provider: pg.text("provider").notNull().default("dodo"), // 'dodo' | 'epay'
		providerCustomerId: pg.text("provider_customer_id"),
		providerSubscriptionId: pg.text("provider_subscription_id"),

		// Plan details
		plan: pg.text("plan").notNull().default("free"), // 'free' | 'monthly' | 'yearly' ('trial' = retired $3 weekly product)
		status: pg.text("status").notNull().default("active"), // 'active' | 'on_hold' | 'cancelled' | 'expired' | 'failed' | 'pending'

		// Billing period
		currentPeriodStart: pg.timestamp("current_period_start", { withTimezone: true }),
		currentPeriodEnd: pg.timestamp("current_period_end", { withTimezone: true }),
		cancelAtPeriodEnd: pg.boolean("cancel_at_period_end").notNull().default(false),

		// The 7-day trial opens a monthly/yearly subscription once per user; set on first trial activation.
		trialUsedAt: pg.timestamp("trial_used_at", { withTimezone: true }),
		// When that trial converts into the chosen plan (from the provider's subscription).
		trialEndsAt: pg.timestamp("trial_ends_at", { withTimezone: true }),

		// Provider metadata (raw webhook data for debugging)
		metadata: pg.jsonb("metadata"),

		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: pg
			.timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date()),
	},
	(t) => [
		pg.index("user_subscription_user_id_idx").on(t.userId),
		pg.index("user_subscription_provider_sub_idx").on(t.providerSubscriptionId),
	],
);

/**
 * Tracks free-plan usage counters per user.
 * Counts resume uploads (AI parse) and AI chats used.
 * For free users these are lifetime limits; for paid users they reset on renewal.
 */
export const userUsage = pg.pgTable(
	"user_usage",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		userId: pg
			.text("user_id")
			.notNull()
			.unique()
			.references(() => user.id, { onDelete: "cascade" }),

		resumeUploadsUsed: pg.integer("resume_uploads_used").notNull().default(0),
		aiChatsUsed: pg.integer("ai_chats_used").notNull().default(0),

		// When the counters were last reset (on subscription renewal for paid users)
		resetAt: pg.timestamp("reset_at", { withTimezone: true }),

		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: pg
			.timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date()),
	},
	(t) => [pg.index("user_usage_user_id_idx").on(t.userId)],
);

/**
 * Idempotency log for webhook events.
 * The webhookId column has a unique constraint so that a duplicate delivery
 * can be detected with a simple INSERT ... ON CONFLICT DO NOTHING.
 */
export const webhookEventLog = pg.pgTable(
	"webhook_event_log",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		webhookId: pg.text("webhook_id").notNull().unique(),
		provider: pg.text("provider").notNull(), // 'dodo' | 'epay'
		eventType: pg.text("event_type").notNull(),
		processedAt: pg.timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [pg.index("webhook_event_log_webhook_id_idx").on(t.webhookId)],
);
