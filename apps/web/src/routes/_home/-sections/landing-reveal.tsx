import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { landingMotion } from "./landing-motion";

/** Progressive enhancement: content stays visible without JavaScript or motion. */
export function LandingReveal({ children }: { children: ReactNode }) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const element = ref.current;
		if (!element || !window.IntersectionObserver || !element.animate) return;
		const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
		if (preference.matches) return;
		let animation: Animation | undefined;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry?.isIntersecting) return;
				if (!preference.matches) {
					animation = element.animate(landingMotion.reveal.keyframes, landingMotion.reveal.options);
				}
				observer.disconnect();
			},
			{ threshold: 0.08 },
		);
		const stopMotion = () => {
			if (preference.matches) animation?.cancel();
		};
		preference.addEventListener("change", stopMotion);
		observer.observe(element);
		return () => {
			observer.disconnect();
			animation?.cancel();
			preference.removeEventListener("change", stopMotion);
		};
	}, []);

	return <div ref={ref}>{children}</div>;
}
