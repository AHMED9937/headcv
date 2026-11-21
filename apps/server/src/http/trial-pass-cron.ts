/**
 * Vercel Cron entry for ending one-time 7-day trial passes (schedule in vercel.json).
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET`. Without a configured secret the route stays closed,
 * so nobody can trigger emails by calling it. Like the webhook, the billing module is imported lazily
 * so env validation does not fire when server tests import createApp.
 */

import type { Context } from "hono";
import { timingSafeEqual } from "node:crypto";

function hasCronSecret(header: string | undefined, secret: string | undefined): boolean {
	if (!secret || !header) return false;
	const expected = Buffer.from(`Bearer ${secret}`);
	const received = Buffer.from(header);
	return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function handleTrialPassCron(c: Context): Promise<Response> {
	const { env } = await import("@headcv/env/server");
	if (!env.CRON_SECRET) console.error("[trial-pass-cron] CRON_SECRET is not set; refusing to run");
	if (!hasCronSecret(c.req.header("authorization"), env.CRON_SECRET)) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	try {
		const { endExpiredTrialPasses } = await import("@headcv/api/features/billing");
		return c.json(await endExpiredTrialPasses());
	} catch (error) {
		console.error("[trial-pass-cron] failed to end trial passes", error);
		return c.json({ error: "Failed to end trial passes" }, 500);
	}
}
