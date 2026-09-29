import { describe, expect, it, vi } from "vitest";

vi.mock("@headcv/env/server", () => ({
	env: {
		APP_URL: "https://app.example.com/",
	},
}));

const { handleLlms, handleRobots, handleSitemap } = await import("./seo");

describe("SEO static endpoints", () => {
	it("generates robots.txt from the normalized app URL", async () => {
		const response = handleRobots();
		const text = await response.text();

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("text/plain; charset=UTF-8");
		expect(text).toContain("User-agent: *");
		expect(text).toContain("Allow: /");
		expect(text).toContain("Disallow: /api/rpc");
		expect(text).toContain("Disallow: /api/auth");
		expect(text).toContain("Disallow: /.well-known");
		expect(text).toContain("Sitemap: https://app.example.com/sitemap.xml");
		expect(text).toContain("Sitemap: https://docs.headcv.com/sitemap.xml");
		expect(text).not.toMatch(/GPTBot|ClaudeBot|PerplexityBot|CCBot|ChatGPT-User/);
	});

	it("generates an app-domain-only sitemap", async () => {
		const response = handleSitemap();
		const text = await response.text();

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("application/xml; charset=UTF-8");
		expect(text).toContain("<loc>https://app.example.com/</loc>");
		expect(text).toContain("<loc>https://app.example.com/templates</loc>");
		expect(text).not.toContain("docs.headcv.com");
		expect(text).not.toContain("/auth");
		expect(text).not.toContain("/dashboard");
		expect(text).not.toContain("/builder");
		expect(text).not.toContain("/schema.json");
	});

	it("generates a machine-readable llms.txt product index", async () => {
		const response = handleLlms();
		const text = await response.text();

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("text/plain; charset=UTF-8");
		expect(text).toContain("# HeadCV");
		expect(text).toContain("HeadCV is a free, open-source resume builder");
		expect(text).toContain("## Product");
		expect(text).toContain("- Guided CV builder: https://app.example.com/");
		expect(text).toContain("- Resume templates: https://app.example.com/templates");
		expect(text).toContain("## Resources");
		expect(text).toContain("- Documentation: https://docs.headcv.com");
		expect(text).toContain("- API / OpenAPI: https://app.example.com/api/openapi/spec.json");
		expect(text).toContain("- Resume schema: https://app.example.com/schema.json");
		expect(text).toContain("- Source code: https://github.com/AHMED9937/headcv");
	});

	it("returns headers without a body for HEAD responses", async () => {
		const response = handleLlms({ head: true });

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("text/plain; charset=UTF-8");
		expect(await response.text()).toBe("");
	});
});
