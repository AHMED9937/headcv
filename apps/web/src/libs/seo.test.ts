import { describe, expect, it } from "vitest";
import {
	createNoindexFollowMeta,
	createRootStructuredDataScript,
	getCanonicalRootUrl,
	getRootStructuredData,
} from "./seo";

const canonicalUrl = "https://headcv.com/";

describe("getCanonicalRootUrl", () => {
	it("uses the production root when no origin is available", () => {
		expect(getCanonicalRootUrl()).toBe(canonicalUrl);
	});

	it("normalizes an app origin to the root URL", () => {
		expect(getCanonicalRootUrl("http://localhost:3000")).toBe("http://localhost:3000/");
		expect(getCanonicalRootUrl(canonicalUrl)).toBe(canonicalUrl);
	});
});

describe("createNoindexFollowMeta", () => {
	it("returns the robots noindex metadata used by private app surfaces", () => {
		expect(createNoindexFollowMeta()).toEqual({ name: "robots", content: "noindex, follow" });
	});
});

describe("createRootStructuredDataScript", () => {
	it("serializes JSON-LD using the structured data script id", () => {
		const script = createRootStructuredDataScript(canonicalUrl);

		expect(script.id).toBe("headcv-structured-data");
		expect(script.type).toBe("application/ld+json");
		expect(JSON.parse(script.children)).toMatchObject({ "@context": "https://schema.org" });
	});

	it("escapes script-breaking sequences in JSON-LD children", () => {
		const script = createRootStructuredDataScript("https://headcv.com/</script><!---->\u2028\u2029");

		expect(script.children).not.toContain("</script");
		expect(script.children).not.toContain("<!--");
		expect(script.children).not.toContain("\u2028");
		expect(script.children).not.toContain("\u2029");
		expect(script.children).toContain("\\u003C/script");
		expect(script.children).toContain("\\u003C!--");
		expect(script.children).toContain("\\u2028");
		expect(script.children).toContain("\\u2029");
	});
});

describe("getRootStructuredData", () => {
	it("describes only conservative visible product facts", () => {
		const schemas = getRootStructuredData(canonicalUrl);

		expect(schemas).toHaveLength(5);
		expect(schemas[0]).toMatchObject({
			"@type": "Organization",
			name: "HeadCV",
			url: canonicalUrl,
			logo: `${canonicalUrl}brand/headcv-mark.png`,
		});
		expect(schemas[1]).toMatchObject({
			"@type": "WebSite",
			name: "HeadCV",
			url: canonicalUrl,
			publisher: { "@id": `${canonicalUrl}#organization` },
		});
		expect(schemas[2]).toMatchObject({
			"@type": ["SoftwareApplication", "WebApplication"],
			name: "HeadCV",
			applicationCategory: "BusinessApplication",
			operatingSystem: "Web",
			isAccessibleForFree: true,
			image: `${canonicalUrl}brand/headcv-mark.png`,
			screenshot: `${canonicalUrl}opengraph/banner.jpg`,
			offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
		});
		expect(schemas[4]).toMatchObject({
			"@type": "FAQPage",
			mainEntity: expect.arrayContaining([
				expect.objectContaining({
					name: "Is HeadCV free to use?",
				}),
			]),
		});
	});
});
