import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@headcv/env/server", () => ({ env: { APP_URL: "https://app.test" } }));

const state = vi.hoisted(() => ({
	claimed: [] as Array<{ userId: string }>,
	users: [] as Array<{ id: string; email: string; name: string }>,
	writes: [] as Array<Record<string, unknown>>,
}));

// Chainable stand-in: the claim is `update().set().where().returning()`, later writes are awaited
// straight after `.where()`, and the owners' lookup is `select().from().where()`.
vi.mock("@headcv/db/client", () => ({
	db: {
		update: () => ({
			set: (values: Record<string, unknown>) => {
				state.writes.push(values);
				return {
					where: () => Object.assign(Promise.resolve(), { returning: () => Promise.resolve(state.claimed) }),
				};
			},
		}),
		select: () => ({ from: () => ({ where: () => Promise.resolve(state.users) }) }),
	},
}));

const sendEmail = vi.hoisted(() => vi.fn());
vi.mock("@headcv/email/transport", () => ({ sendEmail }));
vi.mock("@headcv/email/templates/billing", () => ({ trialEndedEmail: () => null }));

const { endExpiredTrialPasses } = await import("./trial-pass");

beforeEach(() => {
	vi.clearAllMocks();
	state.claimed = [];
	state.users = [];
	state.writes = [];
	sendEmail.mockResolvedValue(undefined);
});

describe("endExpiredTrialPasses", () => {
	it("emails each ended pass once and moves it to Free", async () => {
		state.claimed = [{ userId: "u1" }, { userId: "u2" }];
		state.users = [
			{ id: "u1", email: "one@example.com", name: "One" },
			{ id: "u2", email: "two@example.com", name: "Two" },
		];

		await expect(endExpiredTrialPasses()).resolves.toEqual({ ended: 2, failed: 0 });

		expect(sendEmail).toHaveBeenCalledTimes(2);
		expect(sendEmail).toHaveBeenCalledWith(
			expect.objectContaining({ to: "one@example.com", subject: "Your HeadCV Pro trial has ended" }),
		);
		// Claimed first (so a second run can't email again), then each moved to Free after its email.
		expect(state.writes[0]).toEqual({ trialEndedEmailAt: expect.any(Date) });
		expect(state.writes.slice(1)).toEqual([
			{ plan: "free", status: "expired" },
			{ plan: "free", status: "expired" },
		]);
	});

	it("releases a claim whose email failed, so the next run retries it", async () => {
		state.claimed = [{ userId: "u1" }];
		state.users = [{ id: "u1", email: "one@example.com", name: "One" }];
		sendEmail.mockRejectedValue(new Error("SMTP down"));
		const log = vi.spyOn(console, "error").mockImplementation(() => {});

		await expect(endExpiredTrialPasses()).resolves.toEqual({ ended: 0, failed: 1 });

		expect(state.writes.slice(1)).toEqual([{ trialEndedEmailAt: null }]);
		log.mockRestore();
	});

	it("sends nothing when no pass has ended", async () => {
		await expect(endExpiredTrialPasses()).resolves.toEqual({ ended: 0, failed: 0 });
		expect(sendEmail).not.toHaveBeenCalled();
	});
});
