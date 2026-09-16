import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { EyeIcon, PencilSimpleLineIcon } from "@phosphor-icons/react";
import { cn } from "@headcv/utils/style";

export type MobileBuilderView = "editor" | "preview";

type Props = {
	value: MobileBuilderView;
	onChange: (view: MobileBuilderView) => void;
};

const views = [
	{ id: "editor", label: <Trans>Editor</Trans>, icon: PencilSimpleLineIcon },
	{ id: "preview", label: <Trans>Preview</Trans>, icon: EyeIcon },
] as const;

export function MobileViewSwitch({ value, onChange }: Props) {
	return (
		<nav className="border-b bg-background/95 px-3 py-2 backdrop-blur" aria-label={t`Builder view`}>
			<div className="grid grid-cols-2 rounded-xl bg-muted/70 p-1">
				{views.map((view) => (
					<button
						key={view.id}
						type="button"
						onClick={() => onChange(view.id)}
						className={cn(
							"flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
							value === view.id
								? "bg-background text-primary shadow-sm"
								: "text-muted-foreground hover:text-foreground",
						)}
						aria-current={value === view.id ? "page" : undefined}
					>
						<view.icon className="size-4" aria-hidden="true" />
						{view.label}
					</button>
				))}
			</div>
		</nav>
	);
}
