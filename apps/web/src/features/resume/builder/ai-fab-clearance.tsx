/**
 * Ends a builder pane's scroll content so its last controls can scroll clear of the AI assistant FAB,
 * which floats over the editor in single-pane layouts (below `lg`). Kept dependency-free on purpose.
 */
export function AiFabClearance() {
	return <div aria-hidden="true" className="h-16 lg:hidden" />;
}
