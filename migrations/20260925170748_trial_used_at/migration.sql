ALTER TABLE "user_subscription" ADD COLUMN "trial_used_at" timestamp with time zone;--> statement-breakpoint
-- Backfill: users currently on the trial, or whose verified checkout was a trial, have used it.
UPDATE "user_subscription"
SET "trial_used_at" = COALESCE("current_period_start", "updated_at")
WHERE "trial_used_at" IS NULL
	AND (
		"plan" = 'trial'
		OR ("metadata"->>'pendingPlan' = 'trial' AND "metadata"->>'paymentVerified' = 'true')
	);
