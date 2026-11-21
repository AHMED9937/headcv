import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

const originalFetch = globalThis.fetch;

const { DodoPaymentsProvider, resetFxCache } = await import("./dodo-provider");
const { CHECKOUT_THEME_CONFIG, checkoutThemeFromCookie } = await import("./checkout-theme");

const baseParams = {
	plan: "monthly" as const,
	trial: false,
	customerEmail: "a@example.com",
	returnUrl: "https://app.test/done",
};

const sentBody = () => createSession.mock.calls.at(-1)?.[0];
const sentCustomization = () => sentBody()?.customization;

function mockFxRates(rates: Record<string, number>) {
	(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
		ok: true,
		json: async () => ({ rates }),
	});
}

beforeEach(() => {
	createSession.mockReset();
	createSession.mockResolvedValue({ checkout_url: "https://test.dodopayments.com/c", session_id: "cks_1" });
	globalThis.fetch = vi.fn();
	vi.stubGlobal("fetch", globalThis.fetch);
	resetFxCache();
});

afterEach(() => {
	globalThis.fetch = originalFetch;
	vi.unstubAllGlobals();
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

	it("keeps the product's paid trial for a trial checkout, on the plan the user chose", async () => {
		await new DodoPaymentsProvider().createCheckoutSession({ ...baseParams, plan: "yearly", trial: true });

		expect(sentBody()?.product_cart).toEqual([{ product_id: "pdt_yearly", quantity: 1 }]);
		// No override: sending trial_period_days would also skip Dodo's "Prevent Trial Misuse" check.
		expect(sentBody()?.subscription_data).toBeUndefined();
	});

	it("switches the trial off for a direct purchase, so the plan is billed in full today", async () => {
		await new DodoPaymentsProvider().createCheckoutSession(baseParams);

		expect(sentBody()?.product_cart).toEqual([{ product_id: "pdt_monthly", quantity: 1 }]);
		expect(sentBody()?.subscription_data).toEqual({ trial_period_days: 0 });
	});
});

describe("DodoPaymentsProvider.getLocalizedPricing", () => {
	it("fetches the USD→EGP rate from the FX API and returns it", async () => {
		mockFxRates({ EGP: 52.37 });

		const result = await new DodoPaymentsProvider().getLocalizedPricing("EG");

		expect(result?.currency).toBe("EGP");
		expect(result?.rate).toBeCloseTo(52.37, 2);
		expect(fetch).toHaveBeenCalledWith("https://open.er-api.com/v6/latest/USD");
	});

	it("returns SAR for Saudi Arabia", async () => {
		mockFxRates({ SAR: 3.75 });

		const result = await new DodoPaymentsProvider().getLocalizedPricing("SA");

		expect(result?.currency).toBe("SAR");
		expect(result?.rate).toBeCloseTo(3.75, 2);
	});

	it("returns EUR for Germany", async () => {
		mockFxRates({ EUR: 0.92 });

		const result = await new DodoPaymentsProvider().getLocalizedPricing("DE");

		expect(result?.currency).toBe("EUR");
		expect(result?.rate).toBeCloseTo(0.92, 2);
	});

	it("returns null for unsupported countries without calling the FX API", async () => {
		expect(await new DodoPaymentsProvider().getLocalizedPricing("AQ")).toBeNull();
		expect(fetch).not.toHaveBeenCalled();
	});

	it("returns null when the FX API response is missing the target currency", async () => {
		mockFxRates({ USD: 1 });

		expect(await new DodoPaymentsProvider().getLocalizedPricing("EG")).toBeNull();
	});

	it("returns null (UI stays in USD) when the FX API call fails", async () => {
		(fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("network"));

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
