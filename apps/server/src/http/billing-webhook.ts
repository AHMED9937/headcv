/**
 * Dodo Payments webhook Hono handler.
 *
 * Reads the raw request body (never re-serialized) and passes it to
 * processDodoWebhook which verifies the signature and processes events.
 *
 * Responds 200 within 15s. On duplicate webhook-id, returns 200 (already processed).
 * On signature failure, returns 401.
 *
 * The billing module is imported lazily so that the env-validation side-effect
 * does not fire at module-load time (which would break server tests that import
 * createApp without setting every env var).
 */

import type { Context } from "hono";

export async function handleDodoWebhook(c: Context): Promise<Response> {
	try {
		const { processDodoWebhook } = await import("@headcv/api/features/billing");

		const rawBody = await c.req.text();

		const headers: Record<string, string> = {};
		for (const [key, value] of c.req.raw.headers.entries()) {
			headers[key.toLowerCase()] = value;
		}

		await processDodoWebhook(rawBody, headers);

		return c.json({ received: true });
	} catch (error) {
		// Checked by name: the billing module is imported lazily, so its class isn't in scope here.
		if (error instanceof Error && error.name === "WebhookSignatureError") {
			// The reason (e.g. "No matching signature found" = wrong DODO_PAYMENTS_WEBHOOK_KEY) is safe
			// to log; the secret and payload are not.
			console.warn(`[billing-webhook] rejected webhook ${c.req.header("webhook-id") ?? "(no id)"}: ${error.message}`);
			return c.json({ error: "Invalid webhook signature" }, 401);
		}
		// Non-2xx makes Dodo retry (8 attempts over ~27h); the claim was released upstream.
		console.error("[billing-webhook] Error processing webhook:", error);
		return c.json({ error: "Webhook processing failed" }, 500);
	}
}
