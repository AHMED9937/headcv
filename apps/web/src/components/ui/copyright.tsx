import { Trans } from "@lingui/react/macro";
import { cn } from "@headcv/utils/style";

type Props = React.ComponentProps<"div">;

export function Copyright({ className, ...props }: Props) {
	const currentYear = new Date().getFullYear();

	return (
		<div className={cn("text-muted-foreground/80 text-xs leading-relaxed", className)} {...props}>
			<p>
				<Trans>© {currentYear} HeadCV. All rights reserved.</Trans>
			</p>
			<p className="mt-4">
				<Trans comment="App version label in footer; includes semantic version variable">
					HeadCV v{__APP_VERSION__}
				</Trans>
			</p>
		</div>
	);
}
