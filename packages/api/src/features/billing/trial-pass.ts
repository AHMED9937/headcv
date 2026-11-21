/**
 * End of the one-time 7-day trial pass. Access already ends on time (getEffectiveAccess); this job, run by
 * Vercel Cron, moves each ended pass to Free and sends the "your trial has ended" email exactly once.
 */

import { and, eq, inArray, isNull, lte } from "drizzle-orm";
import { db } from "@headcv/db/client";
import { user, userSubscription } from "@headcv/db/schema";
import { trialEndedEmail } from "@headcv/email/templates/billing";
import { sendEmail } from "@headcv/email/transport";
import { env } from "@headcv/env/server";

export async function endExpiredTrialPasses(now = new Date()): Promise<{ ended: number; failed: number }> {
	// Claim every ended pass in one statement, so overlapping runs never email the same user twice.
	const claimed = await db
		.update(userSubscription)
		.set({ trialEndedEmailAt: now })
		.where(
			and(
				eq(userSubscription.plan, "trial_pass"),
				lte(userSubscription.currentPeriodEnd, now),
				isNull(userSubscription.trialEndedEmailAt),
			),
		)
		.returning({ userId: userSubscription.userId });
	if (claimed.length === 0) return { ended: 0, failed: 0 };

	const owners = await db
		.select({ id: user.id, email: user.email, name: user.name })
		.from(user)
		.where(
			inArray(
				user.id,
				claimed.map((row) => row.userId),
			),
		);

	let ended = 0;
	let failed = 0;
	for (const owner of owners) {
		try {
			await sendEmail({
				to: owner.email,
				subject: "Your HeadCV Pro trial has ended",
				react: trialEndedEmail({ name: owner.name, plansUrl: `${env.APP_URL}/dashboard/settings/billing` }),
			});
			await db
				.update(userSubscription)
				.set({ plan: "free", status: "expired" })
				.where(and(eq(userSubscription.userId, owner.id), eq(userSubscription.plan, "trial_pass")));
			ended += 1;
		} catch (error) {
			// Release the claim so the next run retries; access has already ended either way.
			await db.update(userSubscription).set({ trialEndedEmailAt: null }).where(eq(userSubscription.userId, owner.id));
			console.error(`[trial-pass] could not send the trial-ended email to user ${owner.id}`, error);
			failed += 1;
		}
	}

	return { ended, failed };
}
