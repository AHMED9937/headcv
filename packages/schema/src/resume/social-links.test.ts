import { describe, expect, it } from "vitest";
import { iconForNetwork, iconForUrl, resolveLinkIcon } from "./social-links";

describe("social links", () => {
	it.each([
		["LinkedIn", "linkedin-logo"],
		["GitHub", "github-logo"],
		["Instagram", "instagram-logo"],
	])("maps %s to its brand icon", (network, icon) => {
		expect(iconForNetwork(network)).toBe(icon);
	});

	it("infers icons from URLs with or without a scheme", () => {
		expect(iconForUrl("https://www.linkedin.com/in/jane")).toBe("linkedin-logo");
		expect(iconForUrl("github.com/jane")).toBe("github-logo");
	});

	it("falls back to the generic link icon", () => {
		expect(resolveLinkIcon("Unknown", "https://example.com/jane")).toBe("globe");
	});
});
