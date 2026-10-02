import { BrandIcon } from "@headcv/ui/components/brand-icon";
import { cn } from "@headcv/utils/style";

/**
 * A fixed LTR lockup keeps the monogram and wordmark together in every locale.
 * The monogram is decorative: the wordmark text and the wrapping link's aria-label name it.
 */
export function LandingBrand({ className }: { className?: string }) {
	return (
		<span dir="ltr" className={cn("inline-flex shrink-0 items-center gap-2.5", className)}>
			<BrandIcon alt="" aria-hidden="true" className="size-14" />
			<span className="whitespace-nowrap font-bold font-display text-[1.35rem] text-primary leading-none tracking-[-0.045em]">
				Head<span className="text-accent-strong">CV</span>
			</span>
		</span>
	);
}
