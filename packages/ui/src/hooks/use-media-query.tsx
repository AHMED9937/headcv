import { useCallback, useSyncExternalStore } from "react";

/**
 * Subscribes to a CSS media query. The value is read synchronously, so the very first render already
 * matches the viewport instead of flashing the wrong layout; `false` where there is no `window`.
 */
export function useMediaQuery(query: string) {
	const subscribe = useCallback(
		(onChange: () => void) => {
			const mql = window.matchMedia(query);
			mql.addEventListener("change", onChange);
			return () => mql.removeEventListener("change", onChange);
		},
		[query],
	);

	return useSyncExternalStore(
		subscribe,
		() => window.matchMedia(query).matches,
		() => false,
	);
}
