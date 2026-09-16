const GUEST_SESSION_KEY = "headcv-guest-session-id";
const LEGACY_GUEST_SESSION_KEY = "headcv-guest-session-id";

function getStoredGuestSessionId(): string | null {
	const current = window.localStorage.getItem(GUEST_SESSION_KEY);
	if (current) return current;

	const legacy = window.localStorage.getItem(LEGACY_GUEST_SESSION_KEY);
	if (!legacy) return null;

	window.localStorage.setItem(GUEST_SESSION_KEY, legacy);
	window.localStorage.removeItem(LEGACY_GUEST_SESSION_KEY);
	return legacy;
}

export function getOrCreateGuestSessionId(): string {
	if (typeof window === "undefined") return "";

	const existing = getStoredGuestSessionId();
	if (existing) return existing;

	const id = crypto.randomUUID();
	window.localStorage.setItem(GUEST_SESSION_KEY, id);
	return id;
}

export function getGuestSessionId(): string | null {
	if (typeof window === "undefined") return null;
	return getStoredGuestSessionId();
}

export function clearGuestSessionId(): void {
	if (typeof window === "undefined") return;
	window.localStorage.removeItem(GUEST_SESSION_KEY);
	window.localStorage.removeItem(LEGACY_GUEST_SESSION_KEY);
}
