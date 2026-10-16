/** Providers that verify email ownership, so their accounts may be linked to an existing user. */
export const TRUSTED_SOCIAL_PROVIDERS: readonly string[] = ["google", "apple", "github", "linkedin"];

type LinkingAdapter = {
	findUserById: (userId: string) => Promise<{ emailVerified: boolean } | null>;
	findAccounts: (userId: string) => Promise<Array<{ id: string; providerId: string }>>;
	deleteAccount: (accountId: string) => Promise<unknown>;
	deleteSessions: (userId: string) => Promise<unknown>;
};

/**
 * Pre-account-takeover guard, run just before a provider account is linked.
 *
 * A trusted provider has just proved ownership of the email, but the existing user never
 * verified it — so its password may belong to whoever registered the address first. Remove that
 * unverified password login and its sessions; the provider sign-in then continues normally.
 */
export async function revokeUnverifiedCredentials(
	account: { providerId: string; userId: string },
	adapter: LinkingAdapter,
): Promise<void> {
	if (!TRUSTED_SOCIAL_PROVIDERS.includes(account.providerId)) return;

	const user = await adapter.findUserById(account.userId);
	if (!user || user.emailVerified) return;

	const accounts = await adapter.findAccounts(account.userId);
	for (const existing of accounts) {
		if (existing.providerId === "credential") await adapter.deleteAccount(existing.id);
	}
	await adapter.deleteSessions(account.userId);
}
