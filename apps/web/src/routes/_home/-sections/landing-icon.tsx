import type { Icon } from "@phosphor-icons/react";
import { cn } from "@headcv/utils/style";

/** Decorative companion to a visible label, never an icon-only control. */
export function LandingIcon({ icon: Icon, size = "sm" }: { icon: Icon; size?: "sm" | "md" }) {
	return (
		<span
			aria-hidden="true"
			className={cn(
				"inline-flex shrink-0 items-center justify-center border border-[#d8c9a5] bg-linear-to-br from-[#fffdf7] to-[#eee3c9] text-[#1e3a5f] shadow-[inset_0_1px_0_#ffffffb3,0_1px_2px_#1526420a]",
				size === "md" ? "size-12 rounded-2xl" : "size-8 rounded-lg",
			)}
		>
			<Icon weight="regular" className={size === "md" ? "size-6" : "size-4.5"} />
		</span>
	);
}
