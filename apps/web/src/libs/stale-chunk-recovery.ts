// Recovery for the "Failed to fetch dynamically imported module" error.
//
// The app is code-split per route (autoCodeSplitting), so each route is a
// content-hashed chunk loaded on demand. After a new deploy the old chunk
// hashes no longer exist on the production alias, so a client still running the
// previous build 404s when it lazy-loads a route (navigation, or hover preload).
//
// Vite fires a `vite:preloadError` event on window when such an import fails.
// The fix is a single full reload: it fetches a fresh index.html that points at
// the current chunk hashes. A short debounce (stored in sessionStorage) prevents
// a reload loop if the asset is genuinely gone rather than merely stale.

const RELOAD_GUARD_KEY = "headcv:stale-chunk-reload-at";
const RELOAD_DEBOUNCE_MS = 10_000;

const readLastReloadAt = (win: Window): number => {
	try {
		return Number(win.sessionStorage.getItem(RELOAD_GUARD_KEY) ?? 0);
	} catch {
		// sessionStorage can throw (private mode / blocked storage); treat as never reloaded.
		return 0;
	}
};

const rememberReload = (win: Window, at: number): void => {
	try {
		win.sessionStorage.setItem(RELOAD_GUARD_KEY, String(at));
	} catch {
		// Ignore storage failures; the reload still helps the common case.
	}
};

export const installStaleChunkRecovery = (win: Window = window): void => {
	win.addEventListener("vite:preloadError", (event) => {
		const now = Date.now();

		// Already reloaded moments ago and it still fails → the chunk is really
		// missing, not just stale. Stop reloading and let the router surface the error.
		if (now - readLastReloadAt(win) < RELOAD_DEBOUNCE_MS) return;

		// Opt out of Vite's default of rethrowing the preload error; we recover instead.
		event.preventDefault();
		rememberReload(win, now);
		win.location.reload();
	});
};
