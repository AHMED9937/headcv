import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";

const endExpiredTrialPasses = vi.hoisted(() => vi.fn());
const env = vi.hoisted(() => ({ CRON_SECRET: undefined as string | undefined }));

vi.mock("@headcv/api/features/billing", () => ({ endExpiredTrialPasses }));
vi.mock("@headcv/env/server", () => ({ env }));

const { handleTrialPassCron } = await import("./trial-pass-cron");

const SECRET = "cron-secret-for-tests-0123456789";
const app = new Hono().get("/api/cron/trial-pass", (c) => handleTrialPassCron(c));
const call = (authorization?: string) =>
	app.request("/api/cron/trial-pass", { headers: authorization ? { authorization } : {} });

beforeEach(() => {
	endExpiredTrialPasses.mockReset();
	endExpiredTrialPasses.mockResolvedValue({ ended: 2, failed: 0 });
	env.CRON_SECRET = SECRET;
});

describe("GET /api/cron/trial-pass", () => {
	it("ends expired passes when Vercel Cron calls with the secret", async () => {
		const response = await call(`Bearer ${SECRET}`);

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ ended: 2, failed: 0 });
		expect(endExpiredTrialPasses).toHaveBeenCalledTimes(1);
	});

	it("rejects callers without the secret or with a wrong one", async () => {
		expect((await call()).status).toBe(401);
		expect((await call("Bearer wrong")).status).toBe(401);
		expect((await call(SECRET)).status).toBe(401);
		expect(endExpiredTrialPasses).not.toHaveBeenCalled();
	});

	it("stays closed when no secret is configured", async () => {
		env.CRON_SECRET = undefined;
		vi.spyOn(console, "error").mockImplementation(() => {});

		expect((await call("Bearer undefined")).status).toBe(401);
		expect((await call("Bearer ")).status).toBe(401);
		expect(endExpiredTrialPasses).not.toHaveBeenCalled();
	});

	it("answers 500 when the job fails, so the run shows as failed in Vercel", async () => {
		endExpiredTrialPasses.mockRejectedValue(new Error("db down"));
		vi.spyOn(console, "error").mockImplementation(() => {});

		expect((await call(`Bearer ${SECRET}`)).status).toBe(500);
	});
});
