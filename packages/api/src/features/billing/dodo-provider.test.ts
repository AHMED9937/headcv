import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@headcv/env/server", () => ({
	env: {
		DODO_PAYMENTS_API_KEY: "dodo_test_key",
		DODO_PAYMENTS_ENVIRONMENT: "test_mode",
		DODO_PRODUCT_MONTHLY_ID: "pdt_monthly",
		DODO_PRODUCT_YEARLY_ID: "pdt_yearly",
		DODO_PRODUCT_TRIAL_ID: "pdt_trial",
	},
}));

const createSession = vi.hoisted(() => vi.fn());

vi.mock("dodopayments", () => ({
	default: class {
		checkoutSessions = { create: createSession };
	},
}));

const { DodoPaymentsProvider } = await import("./dodo-provider");
const { CHECKOUT_THEME_CONFIG, checkoutThemeFromCookie } = await import("./checkout-theme");

const baseParams = { plan: "monthly" as const, customerEmail: "a@example.com", returnUrl: "https://app.test/done" };

const sentCustomization = () => createSession.mock.calls.at(-1)?.[0].customization;

beforeEach(() => {
	createSession.mockReset();
	createSession.mockResolvedValue({ checkout_url: "https://test.dodopayments.com/c", session_id: "cks_1" });
});

describe("DodoPaymentsProvider.createCheckoutSession", () => {
	it("sends the brand theme config and the user's theme mode", async () => {
		await new DodoPaymentsProvider().createCheckoutSession({ ...baseParams, theme: "dark" });

		expect(sentCustomization()).toEqual({ theme: "dark", theme_config: CHECKOUT_THEME_CONFIG });
	});

	it("defaults to light, matching the app's default theme", async () => {
		await new DodoPaymentsProvider().createCheckoutSession(baseParams);

		expect(sentCustomization()?.theme).toBe("light");
	});
});

describe("checkoutThemeFromCookie", () => {
	it.each([
		["dark", "dark"],
		["light", "light"],
		[undefined, "light"],
		["<script>", "light"],
	] as const)("maps %s to %s", (cookie, expected) => {
		expect(checkoutThemeFromCookie(cookie)).toBe(expected);
	});
});
