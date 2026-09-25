import type { DialogSchema } from "./schemas";
import { lazy, Suspense, useEffect } from "react";
import { Dialog } from "@headcv/ui/components/dialog";
import { useDialogStore } from "./store";

// Every dialog (rich-text editor, importers, section forms) lives behind this import so it
// stays out of the entry bundle that every page, including the landing page, must download.
const loadRenderers = () => import("./renderers");

const DialogRenderer = lazy(async () => {
	const { renderDialog } = await loadRenderers();
	return { default: ({ dialog }: { dialog: DialogSchema }) => renderDialog(dialog) };
});

/** Warm the dialog chunk once the page is idle, so the first open has no visible delay. */
function usePrefetchDialogs() {
	useEffect(() => {
		const prefetch = () => void loadRenderers();
		if ("requestIdleCallback" in window) {
			const id = window.requestIdleCallback(prefetch, { timeout: 5000 });
			return () => window.cancelIdleCallback(id);
		}
		// Safari has no requestIdleCallback.
		const id = globalThis.setTimeout(prefetch, 3000);
		return () => globalThis.clearTimeout(id);
	}, []);
}

export function DialogManager() {
	const { open, activeDialog, onOpenChange } = useDialogStore();
	usePrefetchDialogs();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			{activeDialog && (
				<Suspense fallback={null}>
					<DialogRenderer dialog={activeDialog} />
				</Suspense>
			)}
		</Dialog>
	);
}
