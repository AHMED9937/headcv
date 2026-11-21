import { beforeEach, describe, expect, it, vi } from "vitest";

const dbState = vi.hoisted(() => ({ subscription: {} as Record<string, unknown>, resumeCount: 0 }));

// Minimal chainable stand-in: subscription reads end in `.limit()`, the resume count in `.where()`.
vi.mock("@headcv/db/client", () => ({
	db: {
		select: (fields?: Record<string, unknown>) => ({
			from: () => ({
				where: () =>
					fields && "count" in fields
						? Promise.resolve([{ count: dbState.resumeCount }])
						: { limit: () => Promise.resolve([dbState.subscription]) },
			}),
		}),
	},
}));

const { billingService, entitlementService, getEffectiveAccess, getPlanLimits, getTrialEnd, hasUsedTrial } =
	await import("./service");

const activeSubscription = (plan: string) => ({
	userId: "user-1",
	plan,
	status: "active",
	cancelAtPeriodEnd: false,
	currentPeriodEnd: null,
	trialUsedAt: null,
});

describe("hasUsedTrial", () => {
	it("allows a first trial", () => {
		expect(hasUsedTrial({ plan: "free", trialUsedAt: null })).toBe(false);
	});

	it("blocks users who are on the trial or already had it", () => {
		expect(hasUsedTrial({ plan: "trial", trialUsedAt: null })).toBe(true);
		expect(hasUsedTrial({ plan: "trial_pass", trialUsedAt: null })).toBe(true);
		expect(hasUsedTrial({ plan: "free", trialUsedAt: new Date("2026-01-01") })).toBe(true);
		expect(hasUsedTrial({ plan: "monthly", trialUsedAt: new Date("2026-01-01") })).toBe(true);
	});
});

describe("getTrialEnd", () => {
	const DAY = 24 * 60 * 60 * 1000;
	const inDays = (days: number) => new Date(Date.now() + days * DAY);
	const trialing = {
		plan: "yearly",
		status: "active",
		cancelAtPeriodEnd: false,
		currentPeriodEnd: inDays(3),
		trialEndsAt: inDays(3),
	};

	it("reports a running trial on the plan it turns into", () => {
		expect(getTrialEnd(trialing)).toEqual(trialing.trialEndsAt);
	});

	it("is over once the trial has converted", () => {
		expect(getTrialEnd({ ...trialing, trialEndsAt: inDays(-1), currentPeriodEnd: inDays(360) })).toBeNull();
	});

	it("is over when the subscription ended during the trial", () => {
		expect(getTrialEnd({ ...trialing, plan: "free", status: "expired" })).toBeNull();
	});

	it("reads the retired $3 weekly trial from its period end", () => {
		expect(getTrialEnd({ ...trialing, plan: "trial", trialEndsAt: null })).toEqual(trialing.currentPeriodEnd);
	});

	it("reads a running 7-day pass from its period end", () => {
		expect(getTrialEnd({ ...trialing, plan: "trial_pass", trialEndsAt: null })).toEqual(trialing.currentPeriodEnd);
	});
});

describe("billingService.startTrialPass", () => {
	it("grants exactly 7 days from the payment, as a pass with no subscription and the trial marked used", async () => {
		const upsert = vi.spyOn(billingService, "upsertSubscription").mockResolvedValue(undefined as never);
		const startedAt = new Date("2026-11-21T10:00:00Z");

		const endsAt = await billingService.startTrialPass({
			userId: "user-1",
			provider: "dodo",
			providerCustomerId: "cus_1",
			startedAt,
			metadata: { payment_id: "pay_1" },
		});

		expect(endsAt).toEqual(new Date("2026-11-28T10:00:00Z"));
		expect(upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: "user-1",
				plan: "trial_pass",
				status: "active",
				providerSubscriptionId: "",
				currentPeriodStart: startedAt,
				currentPeriodEnd: endsAt,
				cancelAtPeriodEnd: false,
				trial: { endsAt: null },
			}),
		);
		upsert.mockRestore();
	});
});

describe("getPlanLimits", () => {
	it("gives free users 3 resumes and every paid plan unlimited", () => {
		expect(getPlanLimits("free").resumes).toBe(3);
		expect(getPlanLimits("trial").resumes).toBe(-1);
		expect(getPlanLimits("trial_pass").resumes).toBe(-1);
		expect(getPlanLimits("monthly").resumes).toBe(-1);
		expect(getPlanLimits("yearly").resumes).toBe(-1);
		expect(getPlanLimits("unknown").resumes).toBe(3);
	});
});

describe("entitlementService.getResumeAllowance", () => {
	beforeEach(() => {
		dbState.subscription = activeSubscription("free");
		dbState.resumeCount = 0;
	});

	it("lets a free user create up to 3 resumes", async () => {
		dbState.resumeCount = 2;
		await expect(entitlementService.getResumeAllowance("user-1")).resolves.toEqual({
			used: 2,
			limit: 3,
			canCreate: true,
		});
	});

	it("blocks a free user's 4th resume", async () => {
		dbState.resumeCount = 3;
		await expect(entitlementService.getResumeAllowance("user-1")).resolves.toMatchObject({ canCreate: false });
	});

	it("never blocks paid users", async () => {
		dbState.subscription = activeSubscription("monthly");
		dbState.resumeCount = 40;
		await expect(entitlementService.getResumeAllowance("user-1")).resolves.toEqual({
			used: 40,
			limit: -1,
			canCreate: true,
		});
	});

	it("applies the free limit when a paid plan is no longer active", async () => {
		dbState.subscription = { ...activeSubscription("monthly"), status: "on_hold" };
		dbState.resumeCount = 5;
		await expect(entitlementService.getResumeAllowance("user-1")).resolves.toMatchObject({
			limit: 3,
			canCreate: false,
		});
	});
});

describe("getEffectiveAccess", () => {
	const HOUR = 60 * 60 * 1000;
	const active = (periodEndOffsetMs: number) => ({
		plan: "monthly",
		status: "active",
		cancelAtPeriodEnd: false,
		currentPeriodEnd: new Date(Date.now() + periodEndOffsetMs),
	});

	it("keeps Pro briefly after the period ends while the renewal webhook is on its way", () => {
		expect(getEffectiveAccess(active(-2 * HOUR))).toBe("paid");
	});

	it("drops to Free when no renewal arrived within a day", () => {
		expect(getEffectiveAccess(active(-25 * HOUR))).toBe("free");
	});

	it("keeps Pro until the end of a period whose cancellation is scheduled", () => {
		expect(getEffectiveAccess({ ...active(5 * 24 * HOUR), status: "cancelled", cancelAtPeriodEnd: true })).toBe("paid");
		expect(getEffectiveAccess({ ...active(-HOUR), status: "cancelled", cancelAtPeriodEnd: true })).toBe("free");
	});

	it("ends a 7-day pass exactly on time, since nothing renews it", () => {
		const pass = (periodEndOffsetMs: number) => ({ ...active(periodEndOffsetMs), plan: "trial_pass" });
		expect(getEffectiveAccess(pass(HOUR))).toBe("paid");
		expect(getEffectiveAccess(pass(-60 * 1000))).toBe("free");
		expect(getEffectiveAccess({ ...pass(HOUR), currentPeriodEnd: null })).toBe("free");
	});
});
