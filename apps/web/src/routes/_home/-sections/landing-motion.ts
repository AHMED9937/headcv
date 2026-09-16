export const landingMotion = {
	reveal: {
		keyframes: [
			{ opacity: 0.72, transform: "translateY(14px)" },
			{ opacity: 1, transform: "translateY(0)" },
		] as Keyframe[],
		options: {
			duration: 420,
			easing: "cubic-bezier(0.22, 1, 0.36, 1)",
		} satisfies KeyframeAnimationOptions,
	},
} as const;

export const landingInteractiveCard =
	"motion-safe:transition-[transform,border-color,box-shadow] motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_12px_30px_rgba(30,58,95,0.09)]";

export const landingSurfaceHover =
	"motion-safe:transition-[border-color,background-color,box-shadow] motion-safe:duration-300 motion-safe:ease-out hover:border-primary/25 hover:bg-card hover:shadow-[0_8px_24px_rgba(30,58,95,0.06)]";

export const landingMediaHover =
	"motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.015]";

export const landingIconHover =
	"motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:scale-105";

export const landingArrowHover =
	"motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:group-hover:translate-x-1 rtl:motion-safe:group-hover:-translate-x-1";

export const landingRowHover =
	"motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-secondary/45";
