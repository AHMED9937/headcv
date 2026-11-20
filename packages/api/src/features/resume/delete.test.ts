import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Deleting a resume is a paid-only capability. The gate lives in `resumeService.delete`
 * (the single chokepoint every caller — REST endpoint and MCP `delete_resume` tool —
 * funnels through), so these tests exercise the service directly with the data layer,
 * billing entitlement, storage and events stubbed out.
 */

const state = vi.hoisted(() => ({
	canDelete: true,
	resumeRow: { isLocked: false } as { isLocked: boolean } | undefined,
	deleted: false,
}));

const storageDelete = vi.hoisted(() => vi.fn().mockResolvedValue(true));

vi.mock("@headcv/env/server", () => ({ env: { APP_URL: "https://example.com" } }));

vi.mock("@headcv/db/client", () => ({
	db: {
		transaction: (cb: (tx: unknown) => Promise<unknown>) =>
			cb({
				select: () => ({
					from: () => ({
						where: () => Promise.resolve(state.resumeRow ? [state.resumeRow] : []),
					}),
				}),
				delete: () => ({
					where: () => {
						state.deleted = true;
						return Promise.resolve();
					},
				}),
			}),
	},
}));

vi.mock("../billing/service", () => ({
	entitlementService: {
		canDeleteResume: () => Promise.resolve(state.canDelete),
		getResumeAllowance: () => Promise.resolve({ used: 0, limit: -1, canCreate: true }),
	},
	RESUME_LIMIT_MESSAGE: "limit",
	RESUME_DELETE_PAID_MESSAGE: "Deleting resumes is a Pro feature. Upgrade your plan to delete resumes.",
}));

vi.mock("../storage/service", () => ({
	getStorageService: () => ({ delete: storageDelete }),
}));

vi.mock("./events", () => ({
	publishResumeUpdated: vi.fn().mockResolvedValue(undefined),
}));

const { resumeService } = await import("./service");

describe("resumeService.delete entitlement gate", () => {
	beforeEach(() => {
		state.canDelete = true;
		state.resumeRow = { isLocked: false };
		state.deleted = false;
		storageDelete.mockClear();
	});

	it("blocks a free user and leaves the resume and its files untouched", async () => {
		state.canDelete = false;

		await expect(resumeService.delete({ id: "r1", userId: "u1" })).rejects.toMatchObject({
			code: "UPGRADE_REQUIRED",
		});
		expect(state.deleted).toBe(false);
		expect(storageDelete).not.toHaveBeenCalled();
	});

	it("deletes the resume and its files for a paid user", async () => {
		await resumeService.delete({ id: "r1", userId: "u1" });

		expect(state.deleted).toBe(true);
		expect(storageDelete).toHaveBeenCalled();
	});

	it("returns NOT_FOUND for a missing or unowned resume before the plan gate", async () => {
		// A free user probing a resume they do not own must not learn it is paywalled.
		state.canDelete = false;
		state.resumeRow = undefined;

		await expect(resumeService.delete({ id: "r1", userId: "u1" })).rejects.toMatchObject({
			code: "NOT_FOUND",
		});
		expect(state.deleted).toBe(false);
	});

	it("still refuses to delete a locked resume for a paid user", async () => {
		state.resumeRow = { isLocked: true };

		await expect(resumeService.delete({ id: "r1", userId: "u1" })).rejects.toMatchObject({
			code: "RESUME_LOCKED",
		});
		expect(state.deleted).toBe(false);
	});
});
