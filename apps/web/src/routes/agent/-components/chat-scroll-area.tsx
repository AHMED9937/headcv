import type { ReactNode } from "react";
import { t } from "@lingui/core/macro";
import { useEffect, useRef } from "react";

export function ChatScrollArea({ children }: { children: ReactNode }) {
	const viewportRef = useRef<HTMLElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const followingRef = useRef(true);

	useEffect(() => {
		const viewport = viewportRef.current;
		const content = contentRef.current;
		if (!viewport || !content) return;
		const follow = () => {
			if (followingRef.current) viewport.scrollTop = viewport.scrollHeight;
		};
		follow();
		const observer = new ResizeObserver(follow);
		observer.observe(content);
		observer.observe(viewport);
		return () => observer.disconnect();
	}, []);

	return (
		<section
			ref={viewportRef}
			aria-label={t`Chat messages`}
			// biome-ignore lint/a11y/noNoninteractiveTabindex: the scrollable transcript must support keyboard scrolling.
			tabIndex={0}
			className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
			onScroll={() => {
				const viewport = viewportRef.current;
				if (viewport) followingRef.current = viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop < 80;
			}}
		>
			<div ref={contentRef}>{children}</div>
		</section>
	);
}
