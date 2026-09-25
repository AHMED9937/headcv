import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";

const processDodoWebhook = vi.hoisted(() => vi.fn());

vi.mock("@headcv/api/features/billing", () => ({ processDodoWebhook }));

const { handleDodoWebhook } = await import("./billing-webhook");

const app = new Hono().post("/api/webhooks/dodo", (c) => handleDodoWebhook(c));
const post = () =>
	app.request("/api/webhooks/dodo", {
		method: "POST",
		headers: { "content-type": "application/json", "webhook-id": "wh_1" },
		body: '{"type":"subscription.active"}',
	});

beforeEach(() => {
	processDodoWebhook.mockClear();
});

describe("POST /api/webhooks/dodo", () => {
	it("passes the exact raw body and lowercased headers through", async () => {
		processDodoWebhook.mockResolvedValue(undefined);
		const response = await post();

		expect(response.status).toBe(200);
		expect(processDodoWebhook).toHaveBeenCalledWith(
			'{"type":"subscription.active"}',
			expect.objectContaining({ "webhook-id": "wh_1" }),
		);
	});

	it("answers 401 for an invalid signature so it is not retried as a server error", async () => {
		const error = new Error("No matching signature found");
		error.name = "WebhookSignatureError";
		processDodoWebhook.mockImplementation(async () => {
			throw error;
		});

		expect((await post()).status).toBe(401);
	});

	it("answers 500 when processing fails so Dodo retries", async () => {
		processDodoWebhook.mockImplementation(async () => {
			throw new Error("db down");
		});

		expect((await post()).status).toBe(500);
	});
});
