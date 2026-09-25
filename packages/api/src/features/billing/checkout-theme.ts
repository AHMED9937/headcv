/**
 * Dodo hosted-checkout theme, mirroring the app's design tokens so the
 * payment page reads as part of the product.
 *
 * Source of truth: packages/ui/src/styles/globals.css (`:root` and `.dark`).
 * Dodo renders on its own origin and can't read our CSS variables, so the
 * values are copied here — update both together.
 */

import type { ThemeConfig } from "dodopayments/resources/checkout-sessions";

export type CheckoutTheme = "light" | "dark";

export const CHECKOUT_THEME_CONFIG: ThemeConfig = {
	radius: "12px", // --radius
	light: {
		bg_primary: "#f5efe6", // --bg
		bg_secondary: "#ffffff", // --surface
		border_primary: "#d9d0c3", // --border
		border_secondary: "#e8e0d6", // --muted
		button_primary: "#1e3a5f", // --primary
		button_primary_hover: "#152642", // --primary-dark
		button_text_primary: "#ffffff", // --primary-foreground
		button_secondary: "#e8e0d6", // --secondary
		button_secondary_hover: "#d9d0c3", // --border
		button_text_secondary: "#1e293b", // --secondary-foreground
		input_focus_border: "#c9a227", // --ring
		text_primary: "#1e293b", // --text
		text_secondary: "#5c6a7a", // --text-muted
		text_placeholder: "#5c6a7a", // --text-muted
		text_error: "#991b1b", // --danger-dark (AA on --bg; --danger isn't)
		text_success: "#065f46", // --success-dark
	},
	dark: {
		bg_primary: "#152642", // --bg
		bg_secondary: "#232b3a", // --surface
		border_primary: "#475569", // --border
		border_secondary: "#1e3a5f", // --muted
		button_primary: "#e8e0d6", // --primary
		button_primary_hover: "#d9d0c3", // --primary-dark
		button_text_primary: "#152642", // --primary-foreground
		button_secondary: "#1e3a5f", // --secondary
		button_secondary_hover: "#2e4a6f", // --primary-light
		button_text_secondary: "#f1f5f9", // --secondary-foreground
		input_focus_border: "#fbbf24", // --ring
		text_primary: "#f1f5f9", // --text
		text_secondary: "#94a3b8", // --text-muted
		text_placeholder: "#94a3b8", // --text-muted
		text_error: "#fca5a5", // --danger-dark
		text_success: "#a7f3d0", // --success-dark
	},
};

/** Reads the app's `theme` cookie (set by apps/web/src/libs/theme.ts); defaults to light like the app. */
export function checkoutThemeFromCookie(value: string | undefined): CheckoutTheme {
	return value === "dark" ? "dark" : "light";
}
