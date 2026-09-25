import { useHotkeys } from "@tanstack/react-hotkeys";
import { lazy, Suspense, useState } from "react";
import { useCommandPaletteStore } from "./store";

// The palette (cmdk, every command page) loads on first use instead of with every page.
const CommandPalette = lazy(() => import("./index").then((module) => ({ default: module.CommandPalette })));

/** Listens for Mod+K until the palette is first opened, then mounts the real palette. */
function CommandPaletteTrigger() {
	const setOpen = useCommandPaletteStore((state) => state.setOpen);
	useHotkeys([{ hotkey: "Mod+K", callback: () => setOpen(true) }]);
	return null;
}

export function LazyCommandPalette() {
	const open = useCommandPaletteStore((state) => state.open);
	// Once loaded, the real palette owns its hotkeys (including Mod+K to close).
	const [loaded, setLoaded] = useState(false);
	if (open && !loaded) setLoaded(true);

	if (!loaded) return <CommandPaletteTrigger />;

	return (
		<Suspense fallback={null}>
			<CommandPalette />
		</Suspense>
	);
}
