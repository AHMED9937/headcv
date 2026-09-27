/** Allowlist entry that turns the email-domain check off. */
export const ANY_EMAIL_DOMAIN = "*";

/**
 * Returns the lowercased domain of an email address, or null when there isn't one.
 * Splits on the last "@" so quoted local parts can't smuggle in a second domain.
 */
export function getEmailDomain(email: string): string | null {
	const normalized = email.trim().toLowerCase();
	const atIndex = normalized.lastIndexOf("@");
	if (atIndex <= 0) return null;

	const domain = normalized.slice(atIndex + 1);
	return domain.length > 0 ? domain : null;
}

/**
 * Whether an email's domain is on the allowlist. Matching is exact: subdomains and
 * look-alikes (e.g. "gmail.com.evil.io") are rejected.
 */
export function isEmailDomainAllowed(email: string, allowedDomains: readonly string[]): boolean {
	if (allowedDomains.includes(ANY_EMAIL_DOMAIN)) return true;

	const domain = getEmailDomain(email);
	if (!domain) return false;

	return allowedDomains.some((allowed) => allowed.trim().toLowerCase() === domain);
}
