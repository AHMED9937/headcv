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

const billing = vi.hoisted(() => ({
	getSubscription: vi.fn(),
	upsertSubscription: vi.fn(),
	addPendingCheckout: vi.fn(),
	startTrialPass: vi.fn(),
}));
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
	providerSubscriptionId: "" as string | null,
	cancelAtPeriodEnd: false,
	currentPeriodStart: null as Date | null,
	currentPeriodEnd: null as Date | null,
	trialUsedAt: null as Date | null,
	trialEndsAt: null as Date | null,
	metadata: null as Record<string, unknown> | null,
};

const passHolder = (daysLeft: number) => ({
	...freeUser,
	plan: "trial_pass",
	currentPeriodEnd: new Date(Date.now() + daysLeft * DAY),
	trialUsedAt: new Date(),
});

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

	it("sells the 7-day trial as the one-time pass", async () => {
		await expect(checkout({ plan: "trial" })).resolves.toEqual({ checkoutUrl: "https://dodo.test/c" });

		expect(provider.createCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({ plan: "trial_pass" }));
		expect(billing.upsertSubscription).toHaveBeenCalledWith(
			expect.objectContaining({ status: "pending", metadata: { sessionId: "cks_1", pendingPlan: "trial_pass" } }),
		);
	});

	it("sells Monthly and Yearly as plain subscriptions", async () => {
		await checkout({ plan: "monthly" });
		expect(provider.createCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({ plan: "monthly" }));
	});

	it("refuses a second trial", async () => {
		billing.getSubscription.mockResolvedValue({ ...freeUser, trialUsedAt: new Date("2026-11-01") });

		await expect(checkout({ plan: "trial" })).rejects.toMatchObject({ code: "TRIAL_ALREADY_USED" });
		expect(provider.createCheckoutSession).not.toHaveBeenCalled();
	});

	it("refuses a second subscription to anyone already paying for one, and keeps their access", async () => {
		billing.getSubscription.mockResolvedValue({
			...freeUser,
			plan: "monthly",
			providerSubscriptionId: "sub_1",
			currentPeriodEnd: new Date(Date.now() + 5 * DAY),
		});

		await expect(checkout({ plan: "yearly" })).rejects.toMatchObject({ code: "ALREADY_SUBSCRIBED" });
		expect(provider.createCheckoutSession).not.toHaveBeenCalled();
		expect(billing.upsertSubscription).not.toHaveBeenCalled();
	});

	it("lets a pass holder buy a plan without losing the days left on the pass", async () => {
		billing.getSubscription.mockResolvedValue(passHolder(3));

		await expect(checkout({ plan: "yearly" })).resolves.toEqual({ checkoutUrl: "https://dodo.test/c" });

		expect(provider.createCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({ plan: "yearly" }));
		expect(billing.addPendingCheckout).toHaveBeenCalledWith("user-1", { sessionId: "cks_1", pendingPlan: "yearly" });
		expect(billing.upsertSubscription).not.toHaveBeenCalled();
	});

	it("rejects the retired paid-trial checkout choices from older pages", async () => {
		await expect(checkout({ plan: "yearly-trial" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
		expect(provider.createCheckoutSession).not.toHaveBeenCalled();
	});
});

describe("billing.verifyAndActivate", () => {
	const paid = { sessionId: "cks_1", paymentStatus: "succeeded", customerId: "cus_1", subscriptionId: null };
	const verify = () => call(billingRouter.verifyAndActivate, {}, { context });

	it("starts the pass when the success page confirms the payment before the webhook", async () => {
		billing.getSubscription.mockResolvedValue({
			...freeUser,
			status: "pending",
			metadata: { sessionId: "cks_1", pendingPlan: "trial_pass" },
		});
		provider.getCheckoutSession.mockResolvedValue(paid);
		const endsAt = new Date(Date.now() + 7 * DAY);
		billing.startTrialPass.mockResolvedValue(endsAt);

		await expect(verify()).resolves.toMatchObject({
			activated: true,
			plan: "trial_pass",
			trialEndsAt: endsAt.toISOString(),
		});
		expect(billing.startTrialPass).toHaveBeenCalledWith(
			expect.objectContaining({ userId: "user-1", providerCustomerId: "cus_1" }),
		);
		expect(billing.upsertSubscription).not.toHaveBeenCalled();
	});

	it("activates the plan a pass holder bought, even while the pass is still running", async () => {
		billing.getSubscription.mockResolvedValue({
			...passHolder(3),
			metadata: { sessionId: "cks_1", pendingPlan: "monthly", paymentVerified: false },
		});
		provider.getCheckoutSession.mockResolvedValue({ ...paid, subscriptionId: "sub_1" });

		await expect(verify()).resolves.toMatchObject({ activated: true, plan: "monthly", trialEndsAt: null });
		expect(billing.upsertSubscription).toHaveBeenCalledWith(
			expect.objectContaining({ plan: "monthly", status: "active", providerSubscriptionId: "sub_1" }),
		);
	});
});

describe("billing.getSubscription", () => {
	it("tells a pass holder when the pass ends", async () => {
		const pass = passHolder(4);
		billing.getSubscription.mockResolvedValue(pass);
		entitlements.getUsage.mockResolvedValue({ aiChatsUsed: 0 });
		entitlements.getResumeAllowance.mockResolvedValue({ used: 1, limit: -1, canCreate: true });

		await expect(call(billingRouter.getSubscription, {}, { context })).resolves.toMatchObject({
			plan: "trial_pass",
			effectiveAccess: "paid",
			trialEligible: false,
			trialEndsAt: pass.currentPeriodEnd.toISOString(),
		});
	});
});
