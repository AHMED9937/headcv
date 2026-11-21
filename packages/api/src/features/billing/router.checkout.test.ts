import { beforeEach, describe, expect, it, vi } from "vitest";
import { call } from "@orpc/server";

vi.mock("@headcv/env/server", () => ({ vercelPreviewOrigins: [], env: { APP_URL: "https://app.test" } }));

// The real auth middleware runs; only the session lookup behind it is stubbed.
const session = vi.hoisted(() => ({ user: null as { id: string; email: string; name: string } | null }));
vi.mock("@headcv/auth/config", () => ({
	auth: { api: { getSession: async () => (session.user ? { user: session.user } : null) } },
	verifyOAuthToken: async () => null,
}));
vi.mock("@headcv/db/client", () => ({ db: {} }));

const billing = vi.hoisted(() => ({ getSubscription: vi.fn(), upsertSubscription: vi.fn() }));
const entitlements = vi.hoisted(() => ({ getUsage: vi.fn(), getResumeAllowance: vi.fn(), resetUsage: vi.fn() }));
vi.mock("./service", async (importOriginal) => ({
	...(await importOriginal<typeof import("./service")>()),
	billingService: billing,
	entitlementService: entitlements,
}));

const provider = vi.hoisted(() => ({ name: "dodo", createCheckoutSession: vi.fn(), getCheckoutSession: vi.fn() }));
vi.mock("./provider.js", () => ({ getPaymentProvider: () => provider }));

const { billingRouter } = await import("./router");

const context = { locale: "en-US" as const, reqHeaders: new Headers() };
const DAY = 24 * 60 * 60 * 1000;

const freeUser = {
	plan: "free",
	status: "active",
	cancelAtPeriodEnd: false,
	currentPeriodStart: null,
	currentPeriodEnd: null,
	trialUsedAt: null as Date | null,
	trialEndsAt: null as Date | null,
	metadata: null as Record<string, unknown> | null,
};

const checkout = (input: Record<string, unknown>) =>
	call(billingRouter.createCheckoutSession, input as never, { context });

beforeEach(() => {
	vi.clearAllMocks();
	session.user = { id: "user-1", email: "owner@example.com", name: "Owner" };
	billing.getSubscription.mockResolvedValue(freeUser);
	provider.createCheckoutSession.mockResolvedValue({ checkoutUrl: "https://dodo.test/c", sessionId: "cks_1" });
});

describe("billing.createCheckoutSession", () => {
	it("rejects signed-out visitors before anything reaches the payment provider", async () => {
		session.user = null;
		await expect(checkout({ plan: "monthly" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
		expect(provider.createCheckoutSession).not.toHaveBeenCalled();
	});

	it("opens the one-time trial on the plan the user chose", async () => {
		await expect(checkout({ plan: "yearly", trial: true })).resolves.toEqual({ checkoutUrl: "https://dodo.test/c" });

		expect(provider.createCheckoutSession).toHaveBeenCalledWith(
			expect.objectContaining({ plan: "yearly", trial: true }),
		);
		expect(billing.upsertSubscription).toHaveBeenCalledWith(
			expect.objectContaining({
				status: "pending",
				metadata: { sessionId: "cks_1", pendingPlan: "yearly", trial: true },
			}),
		);
	});

	it("bills the plan in full when no trial is asked for", async () => {
		await checkout({ plan: "monthly" });
		expect(provider.createCheckoutSession).toHaveBeenCalledWith(
			expect.objectContaining({ plan: "monthly", trial: false }),
		);
	});

	it("refuses a second trial", async () => {
		billing.getSubscription.mockResolvedValue({ ...freeUser, trialUsedAt: new Date("2026-11-01") });

		await expect(checkout({ plan: "monthly", trial: true })).rejects.toMatchObject({ code: "TRIAL_ALREADY_USED" });
		expect(provider.createCheckoutSession).not.toHaveBeenCalled();
	});

	it("refuses a second subscription while the user is paying, trial included, and keeps their access", async () => {
		billing.getSubscription.mockResolvedValue({
			...freeUser,
			plan: "monthly",
			currentPeriodEnd: new Date(Date.now() + 5 * DAY),
			trialUsedAt: new Date(),
			trialEndsAt: new Date(Date.now() + 5 * DAY),
		});

		await expect(checkout({ plan: "yearly" })).rejects.toMatchObject({ code: "ALREADY_SUBSCRIBED" });
		expect(provider.createCheckoutSession).not.toHaveBeenCalled();
		expect(billing.upsertSubscription).not.toHaveBeenCalled();
	});

	it("no longer sells the retired $3 weekly trial plan", async () => {
		await expect(checkout({ plan: "trial" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
		expect(provider.createCheckoutSession).not.toHaveBeenCalled();
	});
});

describe("billing.verifyAndActivate", () => {
	it("records the trial when the success page activates a trial checkout before the webhook", async () => {
		billing.getSubscription.mockResolvedValue({
			...freeUser,
			status: "pending",
			metadata: { sessionId: "cks_1", pendingPlan: "yearly", trial: true },
		});
		provider.getCheckoutSession.mockResolvedValue({
			sessionId: "cks_1",
			paymentStatus: "succeeded",
			customerId: "cus_1",
			subscriptionId: "sub_1",
		});

		await expect(call(billingRouter.verifyAndActivate, {}, { context })).resolves.toMatchObject({
			activated: true,
			plan: "yearly",
			trial: true,
		});
		expect(billing.upsertSubscription).toHaveBeenCalledWith(
			expect.objectContaining({ plan: "yearly", status: "active", trial: { endsAt: null } }),
		);
	});
});

describe("billing.getSubscription", () => {
	it("tells the client when a running trial ends", async () => {
		const trialEndsAt = new Date(Date.now() + 4 * DAY);
		billing.getSubscription.mockResolvedValue({
			...freeUser,
			plan: "yearly",
			currentPeriodEnd: trialEndsAt,
			trialUsedAt: new Date(),
			trialEndsAt,
		});
		entitlements.getUsage.mockResolvedValue({ aiChatsUsed: 0 });
		entitlements.getResumeAllowance.mockResolvedValue({ used: 1, limit: -1, canCreate: true });

		await expect(call(billingRouter.getSubscription, {}, { context })).resolves.toMatchObject({
			plan: "yearly",
			effectiveAccess: "paid",
			trialEligible: false,
			trialEndsAt: trialEndsAt.toISOString(),
		});
	});
});
