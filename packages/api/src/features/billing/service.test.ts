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

const { entitlementService, getEffectiveAccess, getPlanLimits, hasUsedTrial } = await import("./service");

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
		expect(hasUsedTrial({ plan: "free", trialUsedAt: new Date("2026-01-01") })).toBe(true);
		expect(hasUsedTrial({ plan: "monthly", trialUsedAt: new Date("2026-01-01") })).toBe(true);
	});
});

describe("getPlanLimits", () => {
	it("gives free users 3 resumes and every paid plan unlimited", () => {
		expect(getPlanLimits("free").resumes).toBe(3);
		expect(getPlanLimits("trial").resumes).toBe(-1);
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
});
