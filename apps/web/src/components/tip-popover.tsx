import { t } from "@lingui/core/macro";
import { LightbulbIcon } from "@phosphor-icons/react";
import { cn } from "@headcv/utils/style";

export type TipPopoverProps = {
	tips: string[];
	className?: string;
};

export function TipPopover({ tips, className }: TipPopoverProps) {
	if (tips.length === 0) return null;

	return (
		<div
			className={cn("rounded-md border border-primary/20 border-l-4 bg-primary/5 p-3 text-sm", className)}
			role="note"
		>
			<div className="mb-2 flex items-center gap-2 font-semibold text-primary">
				<LightbulbIcon className="size-4" />
				{t`Tip`}
				<span className="sr-only">{t`Job-specific guidance`}</span>
			</div>
			<ul className="list-disc space-y-1 ps-4 text-muted-foreground">
				{tips.map((tip, index) => (
					<li key={`tip-${index}`}>{tip}</li>
				))}
			</ul>
		</div>
	);
}
