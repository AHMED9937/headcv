import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

// A section becomes active once its top crosses this far below the container's top edge.
const ACTIVATION_OFFSET = 96;
// Spy updates pause while a programmatic scroll runs, so the clicked section stays highlighted
// even when it can't reach the top (e.g. short sections at the bottom of the list).
const PROGRAMMATIC_SCROLL_TIMEOUT_MS = 1000;
const SCROLL_SETTLE_MS = 150;

/**
 * Tracks which `#sidebar-<id>` section is currently scrolled into view inside `containerRef`.
 */
export function useScrollSpy<T extends string>(
	containerRef: RefObject<HTMLElement | null>,
	sections: readonly T[],
	initial: T,
) {
	const [active, setActive] = useState<T>(initial);
	const lockTimeoutRef = useRef<number | null>(null);

	const lock = useCallback((ms: number) => {
		if (lockTimeoutRef.current !== null) window.clearTimeout(lockTimeoutRef.current);
		lockTimeoutRef.current = window.setTimeout(() => {
			lockTimeoutRef.current = null;
		}, ms);
	}, []);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		let frame = 0;

		const update = () => {
			frame = 0;

			const threshold = container.getBoundingClientRect().top + ACTIVATION_OFFSET;
			const canScroll = container.scrollHeight > container.clientHeight;
			const atBottom = canScroll && container.scrollTop + container.clientHeight >= container.scrollHeight - 1;

			let next = sections[0];
			for (const id of sections) {
				const element = container.querySelector(`#sidebar-${id}`);
				if (element && element.getBoundingClientRect().top <= threshold) next = id;
			}
			if (atBottom) next = sections[sections.length - 1];
			if (next) setActive(next);
		};

		const onScroll = () => {
			if (lockTimeoutRef.current !== null) {
				lock(SCROLL_SETTLE_MS);
				return;
			}
			if (!frame) frame = window.requestAnimationFrame(update);
		};

		container.addEventListener("scroll", onScroll, { passive: true });
		return () => {
			container.removeEventListener("scroll", onScroll);
			if (frame) window.cancelAnimationFrame(frame);
		};
	}, [containerRef, sections, lock]);

	useEffect(
		() => () => {
			if (lockTimeoutRef.current !== null) window.clearTimeout(lockTimeoutRef.current);
		},
		[],
	);

	const scrollTo = useCallback(
		(id: T) => {
			setActive(id);
			const target = containerRef.current?.querySelector(`#sidebar-${id}`);
			if (!target) return;

			lock(PROGRAMMATIC_SCROLL_TIMEOUT_MS);
			target.scrollIntoView({ behavior: "smooth", block: "start" });
		},
		[containerRef, lock],
	);

	return { active, scrollTo };
}
