import { describe, expect, it, vi } from "vitest";
import { trackEvent } from "./analytics";

describe("trackEvent", () => {
	it("logs a landing_view event in development when no gtag is present", () => {
		const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

		trackEvent({ name: "landing_view" });

		expect(consoleSpy).toHaveBeenCalledWith("[analytics]", { name: "landing_view", properties: {} });
		consoleSpy.mockRestore();
	});

	it("redacts email addresses from event payloads", () => {
		const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

		trackEvent({
			name: "language_select",
			properties: { locale: "en-US" },
		});

		expect(consoleSpy).toHaveBeenCalledWith("[analytics]", {
			name: "language_select",
			properties: { locale: "en-US" },
		});
		consoleSpy.mockRestore();
	});

	it("redacts long text that could contain CV content", () => {
		const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
		const longText = "a".repeat(200);

		trackEvent({ name: "language_select", properties: { locale: longText } });

		const lastCall = consoleSpy.mock.calls.at(-1);
		const payload = lastCall?.[1] as { properties: { locale: string } };
		expect(payload.properties.locale.length).toBeLessThan(130);
		consoleSpy.mockRestore();
	});

	it("calls gtag when it is available on the global object", () => {
		const gtag = vi.fn();
		const globalRef = globalThis as unknown as { gtag?: typeof gtag };
		const originalGtag = globalRef.gtag;
		globalRef.gtag = gtag;

		trackEvent({ name: "landing_cta_click", properties: { cta: "create_my_cv" } });

		expect(gtag).toHaveBeenCalledWith("event", "landing_cta_click", { cta: "create_my_cv" });

		globalRef.gtag = originalGtag;
	});
});
