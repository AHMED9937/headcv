import type { ReactNode } from "react";
import type { MobileBuilderView } from "./mobile-view-switch";
import { useState } from "react";
import { useMediaQuery } from "@headcv/ui/hooks/use-media-query";
import { MobileViewSwitch } from "./mobile-view-switch";

/**
 * Below `lg` a usable form and a readable A4 preview don't fit side by side, so the builder shows one
 * pane at a time. Keep in step with the `lg` variants on the AI assistant FAB.
 */
export const BUILDER_SINGLE_PANE_QUERY = "(max-width: 1023px)";

type Props = {
	editor: ReactNode;
	preview: ReactNode;
};

export function BuilderSplitView({ editor, preview }: Props) {
	const isSinglePane = useMediaQuery(BUILDER_SINGLE_PANE_QUERY);
	const [view, setView] = useState<MobileBuilderView>("editor");

	if (isSinglePane) {
		return (
			<div className="flex min-h-0 flex-1 flex-col">
				<MobileViewSwitch value={view} onChange={setView} />
				<div className="min-h-0 flex-1">{view === "editor" ? editor : preview}</div>
			</div>
		);
	}

	return (
		<div className="grid min-h-0 flex-1 grid-cols-[minmax(25rem,45%)_minmax(0,1fr)] overflow-hidden">
			<div className="min-h-0 border-e bg-background">{editor}</div>
			<div className="min-h-0 bg-muted/30">{preview}</div>
		</div>
	);
}
