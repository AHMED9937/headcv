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
const previewSession = vi.hoisted(() => vi.fn());

vi.mock("dodopayments", () => ({
	default: class {
		checkoutSessions = { create: createSession, preview: previewSession };
	},
}));

const { DodoPaymentsProvider } = await import("./dodo-provider");
const { CHECKOUT_THEME_CONFIG, checkoutThemeFromCookie } = await import("./checkout-theme");

const baseParams = { plan: "monthly" as const, customerEmail: "a@example.com", returnUrl: "https://app.test/done" };

const sentBody = () => createSession.mock.calls.at(-1)?.[0];
const sentPreview = () => previewSession.mock.calls.at(-1)?.[0];
const sentCustomization = () => sentBody()?.customization;

beforeEach(() => {
	createSession.mockReset();
	previewSession.mockReset();
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

	it("does not pin billing_address or billing_currency; Dodo uses browser IP geolocation", async () => {
		await new DodoPaymentsProvider().createCheckoutSession(baseParams);

		expect(sentBody()?.billing_address).toBeUndefined();
		expect(sentBody()?.billing_currency).toBeUndefined();
	});
});

describe("DodoPaymentsProvider.getLocalizedPricing", () => {
	it("derives the local currency and USD→local rate from the checkout preview", async () => {
		previewSession.mockResolvedValue({
			product_cart: [{ currency: "EGP", og_currency: "USD", discounted_price: 108_320, og_price: 2000 }],
		});

		const result = await new DodoPaymentsProvider().getLocalizedPricing("EG");

		expect(sentPreview()?.billing_currency).toBe("EGP");
		expect(sentPreview()?.billing_address).toEqual({ country: "EG" });
		expect(result?.currency).toBe("EGP");
		// 1083.20 EGP ÷ 20.00 USD = 54.16
		expect(result?.rate).toBeCloseTo(54.16, 2);
	});

	it("pins billing_currency + country for a non-EG Arab market (SA → SAR)", async () => {
		previewSession.mockResolvedValue({
			product_cart: [{ currency: "SAR", og_currency: "USD", discounted_price: 7500, og_price: 2000 }],
		});

		const result = await new DodoPaymentsProvider().getLocalizedPricing("SA");

		expect(sentPreview()?.billing_currency).toBe("SAR");
		expect(sentPreview()?.billing_address).toEqual({ country: "SA" });
		expect(result?.currency).toBe("SAR");
		// 75.00 SAR ÷ 20.00 USD = 3.75
		expect(result?.rate).toBeCloseTo(3.75, 2);
	});

	it("handles a real 0-decimal conversion (JP → JPY)", async () => {
		previewSession.mockResolvedValue({
			// ¥3000 (0 decimals) vs $20.00 (cents); rate = 3000 / 20 = 150
			product_cart: [{ currency: "JPY", og_currency: "USD", discounted_price: 3000, og_price: 2000 }],
		});

		const result = await new DodoPaymentsProvider().getLocalizedPricing("JP");

		expect(result?.currency).toBe("JPY");
		expect(result?.rate).toBeCloseTo(150, 2);
	});

	it("rejects an unconverted 0-decimal echo (raw amounts equal) instead of showing a 100x rate", async () => {
		// Adaptive off: Dodo echoes the base integer (2000) as JPY. A scaled-rate check would
		// read this as rate 100 and wrongly localize; the raw-equality guard must reject it.
		previewSession.mockResolvedValue({
			product_cart: [{ currency: "JPY", og_currency: "USD", discounted_price: 2000, og_price: 2000 }],
		});

		expect(await new DodoPaymentsProvider().getLocalizedPricing("JP")).toBeNull();
	});

	it("returns null for unsupported countries", async () => {
		expect(await new DodoPaymentsProvider().getLocalizedPricing("AQ")).toBeNull();
		expect(previewSession).not.toHaveBeenCalled();
	});

	it("returns null when the preview returns a mismatched currency", async () => {
		previewSession.mockResolvedValue({
			product_cart: [{ currency: "EUR", og_currency: "USD", discounted_price: 18_00, og_price: 2000 }],
		});

		expect(await new DodoPaymentsProvider().getLocalizedPricing("EG")).toBeNull();
	});

	it("returns null when the preview returns a fake 1:1 conversion", async () => {
		previewSession.mockResolvedValue({
			product_cart: [{ currency: "EUR", og_currency: "USD", discounted_price: 2000, og_price: 2000 }],
		});

		expect(await new DodoPaymentsProvider().getLocalizedPricing("DE")).toBeNull();
	});

	it("returns null (UI stays in USD) when the preview call fails", async () => {
		previewSession.mockRejectedValue(new Error("network"));

		expect(await new DodoPaymentsProvider().getLocalizedPricing("EG")).toBeNull();
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
