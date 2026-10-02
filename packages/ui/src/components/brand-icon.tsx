import { cn } from "@headcv/utils/style";

type Props = React.ComponentProps<"img">;

export function BrandIcon({ className, ...props }: Props) {
	return (
		<img
			src="/brand/headcv-logo.png"
			alt="HeadCV"
			className={cn("size-14 shrink-0 rounded-[22%] bg-brand-logo-background object-contain p-1", className)}
			{...props}
		/>
	);
}
