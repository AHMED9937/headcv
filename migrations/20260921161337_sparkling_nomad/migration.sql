CREATE TABLE "user_subscription" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL UNIQUE,
	"provider" text DEFAULT 'dodo' NOT NULL,
	"provider_customer_id" text,
	"provider_subscription_id" text,
	"plan" text DEFAULT 'free' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_usage" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL UNIQUE,
	"resume_uploads_used" integer DEFAULT 0 NOT NULL,
	"ai_chats_used" integer DEFAULT 0 NOT NULL,
	"reset_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_event_log" (
	"id" text PRIMARY KEY,
	"webhook_id" text NOT NULL UNIQUE,
	"provider" text NOT NULL,
	"event_type" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "user_subscription_user_id_idx" ON "user_subscription" ("user_id");--> statement-breakpoint
CREATE INDEX "user_subscription_provider_sub_idx" ON "user_subscription" ("provider_subscription_id");--> statement-breakpoint
CREATE INDEX "user_usage_user_id_idx" ON "user_usage" ("user_id");--> statement-breakpoint
CREATE INDEX "webhook_event_log_webhook_id_idx" ON "webhook_event_log" ("webhook_id");--> statement-breakpoint
ALTER TABLE "user_subscription" ADD CONSTRAINT "user_subscription_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_usage" ADD CONSTRAINT "user_usage_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;