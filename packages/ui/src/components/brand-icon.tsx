import { cn } from "@headcv/utils/style";

type Props = React.ComponentProps<"img">;

export function BrandIcon({ className, ...props }: Props) {
	return <img src="/brand/headcv-logo.png" alt="HeadCV" className={cn("size-12", className)} {...props} />;
}
