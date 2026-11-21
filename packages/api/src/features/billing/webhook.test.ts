import { beforeEach, describe, expect, it, vi } from "vitest";

const PRODUCTS = { monthly: "pdt_monthly", yearly: "pdt_yearly", trial: "pdt_trial" };

vi.mock("@headcv/env/server", () => ({
	env: {
		DODO_PRODUCT_MONTHLY_ID: "pdt_monthly",
		DODO_PRODUCT_YEARLY_ID: "pdt_yearly",
		DODO_PRODUCT_TRIAL_ID: "pdt_trial",
	},
}));

const state = vi.hoisted(() => ({
	event: { webhookId: "wh_1", eventType: "subscription.active", data: {} as Record<string, unknown> },
	stored: {} as Record<string, unknown>,
	emailMatch: [] as Array<{ userId: string }>,
}));

const billing = vi.hoisted(() => ({
	claimWebhookEvent: vi.fn(),
	releaseWebhookEvent: vi.fn(),
	upsertSubscription: vi.fn(),
	getSubscription: vi.fn(),
	findUserByProviderCustomer: vi.fn(),
	findUserByProviderSubscription: vi.fn(),
}));

vi.mock("./provider.js", () => ({ getPaymentProvider: () => ({ verifyWebhook: () => state.event }) }));
vi.mock("./service", async (importOriginal) => ({
	...(await importOriginal<typeof import("./service")>()),
	billingService: billing,
	entitlementService: { resetUsage: vi.fn() },
}));
vi.mock("@headcv/db/client", () => ({
	db: {
		select: () => ({
			from: () => ({ innerJoin: () => ({ where: () => ({ limit: () => Promise.resolve(state.emailMatch) }) }) }),
		}),
	},
}));

const { processDodoWebhook, resolvePlan } = await import("./webhook");

const run = (eventType: string, data: Record<string, unknown>) => {
	state.event = { webhookId: "wh_1", eventType, data };
	return processDodoWebhook("{}", {});
};

const lastUpsert = () => billing.upsertSubscription.mock.calls.at(-1)?.[0];

beforeEach(() => {
	vi.clearAllMocks();
	state.stored = {
		plan: "monthly",
		status: "active",
		metadata: null,
		providerCustomerId: "cus_1",
		currentPeriodStart: null,
		currentPeriodEnd: null,
		cancelAtPeriodEnd: false,
	};
	state.emailMatch = [];
	billing.claimWebhookEvent.mockResolvedValue(true);
	billing.getSubscription.mockImplementation(async () => state.stored);
	billing.findUserByProviderCustomer.mockResolvedValue(null);
	billing.findUserByProviderSubscription.mockResolvedValue("user-1");
});

describe("processDodoWebhook", () => {
	it("releases the claim when processing fails so Dodo's retry is processed", async () => {
		billing.upsertSubscription.mockRejectedValueOnce(new Error("db down"));

		await expect(run("subscription.renewed", { subscription_id: "sub_1", status: "active" })).rejects.toThrow(
			"db down",
		);
		expect(billing.releaseWebhookEvent).toHaveBeenCalledWith("wh_1");

		// The retry claims again and succeeds.
		await run("subscription.renewed", { subscription_id: "sub_1", status: "active" });
		expect(billing.upsertSubscription).toHaveBeenCalledTimes(2);
		expect(lastUpsert()).toMatchObject({ status: "active" });
	});

	it("skips duplicates without touching the subscription", async () => {
		billing.claimWebhookEvent.mockResolvedValue(false);
		await run("subscription.active", { subscription_id: "sub_1", status: "active" });
		expect(billing.upsertSubscription).not.toHaveBeenCalled();
	});

	it("takes the plan from the subscribed product, so portal upgrades are recorded", async () => {
		await run("subscription.plan_changed", {
			subscription_id: "sub_1",
			status: "active",
			product_id: PRODUCTS.yearly,
			customer: { customer_id: "cus_1" },
		});
		expect(lastUpsert()).toMatchObject({ plan: "yearly", status: "active" });
	});

	it("does not re-grant access when a late active event arrives for an ended subscription", async () => {
		await run("subscription.active", { subscription_id: "sub_1", status: "cancelled", product_id: PRODUCTS.monthly });
		await run("subscription.renewed", { subscription_id: "sub_1", status: "expired" });
		expect(billing.upsertSubscription).not.toHaveBeenCalled();
	});

	it("fails (for a retry) when a paid subscription matches no user", async () => {
		billing.findUserByProviderSubscription.mockResolvedValue(null);
		await expect(
			run("subscription.active", { subscription_id: "sub_x", status: "active", customer: { email: "a@b.co" } }),
		).rejects.toThrow("cannot find user");
		expect(billing.releaseWebhookEvent).toHaveBeenCalledWith("wh_1");
	});

	it("matches the email fallback only to that user's pending checkout", async () => {
		billing.findUserByProviderSubscription.mockResolvedValue(null);
		state.emailMatch = [{ userId: "user-7" }];
		await run("subscription.active", {
			subscription_id: "sub_7",
			status: "active",
			product_id: PRODUCTS.monthly,
			customer: { email: "Owner@Example.com" },
		});
		expect(lastUpsert()).toMatchObject({ userId: "user-7", plan: "monthly" });
	});

	it("records a cancellation scheduled in the portal and keeps access until the period ends", async () => {
		await run("subscription.updated", {
			subscription_id: "sub_1",
			status: "active",
			product_id: PRODUCTS.monthly,
			cancel_at_next_billing_date: true,
			next_billing_date: "2026-11-01T00:00:00Z",
		});
		expect(lastUpsert()).toMatchObject({
			status: "cancelled",
			cancelAtPeriodEnd: true,
			plan: "monthly",
			currentPeriodEnd: new Date("2026-11-01T00:00:00Z"),
		});
	});

	it("ignores updates for subscriptions that are no longer active", async () => {
		await run("subscription.updated", { subscription_id: "sub_1", status: "on_hold" });
		state.stored = { ...state.stored, status: "expired" };
		await run("subscription.updated", { subscription_id: "sub_1", status: "active" });
		expect(billing.upsertSubscription).not.toHaveBeenCalled();
	});

	it("records the one-time trial on the plan the user chose when the subscription starts with it", async () => {
		await run("subscription.active", {
			subscription_id: "sub_1",
			status: "active",
			product_id: PRODUCTS.yearly,
			customer: { customer_id: "cus_1" },
			created_at: "2026-11-21T10:00:00Z",
			next_billing_date: "2026-11-28T10:00:00Z",
			trial_period_days: 7,
		});
		expect(lastUpsert()).toMatchObject({
			plan: "yearly",
			status: "active",
			trial: { endsAt: new Date("2026-11-28T10:00:00Z") },
		});
	});

	it("records no trial for a subscription bought without one", async () => {
		await run("subscription.active", {
			subscription_id: "sub_1",
			status: "active",
			product_id: PRODUCTS.monthly,
			created_at: "2026-11-21T10:00:00Z",
			trial_period_days: 0,
		});
		expect(lastUpsert()).toMatchObject({ plan: "monthly" });
		expect(lastUpsert()?.trial).toBeUndefined();
	});

	it("bills the chosen plan when the trial converts, without starting another trial", async () => {
		await run("subscription.renewed", {
			subscription_id: "sub_1",
			status: "active",
			product_id: PRODUCTS.monthly,
			created_at: "2026-11-21T10:00:00Z",
			next_billing_date: "2026-12-28T10:00:00Z",
			trial_period_days: 7,
		});
		expect(lastUpsert()).toMatchObject({
			plan: "monthly",
			status: "active",
			currentPeriodEnd: new Date("2026-12-28T10:00:00Z"),
		});
		expect(lastUpsert()?.trial).toBeUndefined();
	});

	it("ignores a stray subscription while the user pays for another one", async () => {
		// A leftover $3 weekly trial being wound down fires plan_changed; it must not replace the paid yearly plan.
		state.stored = {
			...state.stored,
			plan: "yearly",
			providerSubscriptionId: "sub_yearly",
			currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
		};
		billing.findUserByProviderCustomer.mockResolvedValue("user-1");
		const log = vi.spyOn(console, "error").mockImplementation(() => {});

		await run("subscription.plan_changed", {
			subscription_id: "sub_legacy_trial",
			status: "active",
			product_id: PRODUCTS.trial,
			customer: { customer_id: "cus_1" },
			cancel_at_next_billing_date: true,
		});

		expect(billing.upsertSubscription).not.toHaveBeenCalled();
		expect(log).toHaveBeenCalledWith(expect.stringContaining("sub_legacy_trial"));
		log.mockRestore();
	});

	it("lets a returning customer's new subscription replace the one that ended", async () => {
		state.stored = { ...state.stored, plan: "free", status: "expired", providerSubscriptionId: "sub_old" };
		billing.findUserByProviderCustomer.mockResolvedValue("user-1");

		await run("subscription.active", {
			subscription_id: "sub_new",
			status: "active",
			product_id: PRODUCTS.monthly,
			customer: { customer_id: "cus_1" },
		});

		expect(lastUpsert()).toMatchObject({ providerSubscriptionId: "sub_new", plan: "monthly", status: "active" });
	});

	it("acknowledges disputes without changing the subscription", async () => {
		const log = vi.spyOn(console, "error").mockImplementation(() => {});
		await run("dispute.opened", { dispute_id: "dsp_1", payment_id: "pay_1" });
		expect(log).toHaveBeenCalledWith(expect.stringContaining("dsp_1"));
		expect(billing.upsertSubscription).not.toHaveBeenCalled();
		log.mockRestore();
	});
});

describe("resolvePlan", () => {
	it("prefers the product, then the pending checkout plan, then the stored plan", () => {
		// The retired $3 weekly product still maps, so its wind-down events land on the right plan.
		expect(resolvePlan({ product_id: PRODUCTS.trial }, "monthly", "yearly")).toBe("trial");
		expect(resolvePlan({ product_id: "pdt_unknown" }, "yearly", "monthly")).toBe("yearly");
		expect(resolvePlan({}, undefined, "yearly")).toBe("yearly");
		expect(resolvePlan({}, "free", "free")).toBe("monthly");
	});
});
