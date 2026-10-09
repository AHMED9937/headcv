import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@headcv/env/server", () => ({
	vercelPreviewOrigins: [],
	env: {
		DODO_PAYMENTS_API_KEY: "dodo_test_key",
		DODO_PAYMENTS_ENVIRONMENT: "test_mode",
		DODO_PRODUCT_MONTHLY_ID: "pdt_monthly",
		DODO_PRODUCT_YEARLY_ID: "pdt_yearly",
		DODO_PRODUCT_TRIAL_ID: "pdt_trial",
		APP_URL: "https://app.test",
		DATABASE_URL: "postgresql://test",
		AUTH_SECRET: "test-secret",
		GEO_COUNTRY: undefined,
	},
}));

const { detectCountry } = await import("./router");
const { getPaymentProvider } = await import("./provider");

const originalFetch = globalThis.fetch;

describe("detectCountry", () => {
	beforeEach(() => {
		globalThis.fetch = vi.fn();
		vi.stubGlobal("fetch", globalThis.fetch);
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.unstubAllGlobals();
	});

	it("prefers cf-ipcountry header", async () => {
		const headers = new Headers({ "cf-ipcountry": "EG", "x-vercel-ip-country": "US" });
		expect(await detectCountry(headers)).toBe("EG");
		expect(fetch).not.toHaveBeenCalled();
	});

	it("falls back to x-vercel-ip-country when cf-ipcountry is missing", async () => {
		const headers = new Headers({ "x-vercel-ip-country": "DE" });
		expect(await detectCountry(headers)).toBe("DE");
		expect(fetch).not.toHaveBeenCalled();
	});

	it("resolves country from the public IP in x-forwarded-for", async () => {
		const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
		(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ country_code: "EG" }),
		});

		expect(await detectCountry(headers)).toBe("EG");
		expect(fetch).toHaveBeenCalledWith("https://ipwho.is/1.2.3.4");
	});

	it("caches the resolved country per IP", async () => {
		const headers = new Headers({ "x-forwarded-for": "2.3.4.5" });
		(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ country_code: "EG" }),
		});

		await detectCountry(headers);
		await detectCountry(headers);

		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it("skips private IPs and falls back to GEO_COUNTRY", async () => {
		const headers = new Headers({ "x-forwarded-for": "127.0.0.1" });
		(fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("should not be called"));

		expect(await detectCountry(headers)).toBeUndefined();
		expect(fetch).not.toHaveBeenCalled();
	});

	it("falls back to USD when no source resolves", async () => {
		const headers = new Headers();
		(fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("network"));

		expect(await detectCountry(headers)).toBeUndefined();
	});
});

describe("localized-pricing provider routing", () => {
	// Pricing must resolve to a provider that implements getLocalizedPricing. The factory
	// currently routes every country (incl. EG) to Dodo; if it ever routed EG to the epay
	// stub (which has no getLocalizedPricing), Egypt would silently fall back to USD.
	it("uses the Dodo provider, which implements getLocalizedPricing", () => {
		const provider = getPaymentProvider();
		expect(provider.name).toBe("dodo");
		expect(typeof provider.getLocalizedPricing).toBe("function");
	});

	it("routes every country, including EG, to a provider that can price", () => {
		const provider = getPaymentProvider("EG");
		expect(provider.name).toBe("dodo");
		expect(typeof provider.getLocalizedPricing).toBe("function");
	});
});
