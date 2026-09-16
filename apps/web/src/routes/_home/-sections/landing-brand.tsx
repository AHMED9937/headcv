import { cn } from "@headcv/utils/style";

/** A fixed LTR lockup keeps the monogram and wordmark together in every locale. */
export function LandingBrand({ className }: { className?: string }) {
	return (
		<span dir="ltr" className={cn("inline-flex shrink-0 items-center gap-2.5", className)}>
			<img
				src="/brand/headcv-symbol.svg"
				alt="HeadCV"
				width={44}
				height={44}
				className="size-11 shrink-0 object-contain"
			/>
			<span className="whitespace-nowrap font-bold font-display text-[1.35rem] text-primary leading-none tracking-[-0.045em]">
				Head<span className="text-[#ad8428]">CV</span>
			</span>
		</span>
	);
}
