import { describe, expect, it, vi } from "vitest";
import { revokeUnverifiedCredentials } from "./account-linking";

function makeAdapter(emailVerified: boolean | null) {
	return {
		findUserById: vi.fn(async () => (emailVerified === null ? null : { emailVerified })),
		findAccounts: vi.fn(async () => [
			{ id: "acc-password", providerId: "credential" },
			{ id: "acc-github", providerId: "github" },
		]),
		deleteAccount: vi.fn(async () => undefined),
		deleteSessions: vi.fn(async () => undefined),
	};
}

describe("revokeUnverifiedCredentials", () => {
	it("removes the unverified password and sessions before Google is linked", async () => {
		const adapter = makeAdapter(false);

		await revokeUnverifiedCredentials({ providerId: "google", userId: "u1" }, adapter);

		expect(adapter.deleteAccount).toHaveBeenCalledTimes(1);
		expect(adapter.deleteAccount).toHaveBeenCalledWith("acc-password");
		expect(adapter.deleteSessions).toHaveBeenCalledWith("u1");
	});

	it("keeps the password of a verified account (normal linking)", async () => {
		const adapter = makeAdapter(true);

		await revokeUnverifiedCredentials({ providerId: "google", userId: "u1" }, adapter);

		expect(adapter.deleteAccount).not.toHaveBeenCalled();
		expect(adapter.deleteSessions).not.toHaveBeenCalled();
	});

	it("ignores password sign-ups and untrusted providers", async () => {
		const adapter = makeAdapter(false);

		await revokeUnverifiedCredentials({ providerId: "credential", userId: "u1" }, adapter);
		await revokeUnverifiedCredentials({ providerId: "custom", userId: "u1" }, adapter);

		expect(adapter.findUserById).not.toHaveBeenCalled();
		expect(adapter.deleteAccount).not.toHaveBeenCalled();
	});

	it("does nothing when the user doesn't exist yet (brand-new Google sign-up)", async () => {
		const adapter = makeAdapter(null);

		await revokeUnverifiedCredentials({ providerId: "google", userId: "u1" }, adapter);

		expect(adapter.deleteAccount).not.toHaveBeenCalled();
	});
});
