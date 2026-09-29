import fs from "node:fs/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";

const env: {
	APP_URL: string;
	VERCEL_ENV: "production" | "preview" | "development" | undefined;
	GOOGLE_SITE_VERIFICATION: string | undefined;
} = {
	APP_URL: "https://headcv.com/",
	VERCEL_ENV: "production",
	GOOGLE_SITE_VERIFICATION: undefined,
};

vi.mock("@headcv/env/server", () => ({
	env,
}));

vi.mock("node:fs", () => ({
	existsSync: vi.fn(() => true),
}));

vi.mock("node:fs/promises", () => ({
	default: {
		readFile: vi.fn(),
	},
}));

vi.mock("@hono/node-server/serve-static", () => ({
	serveStatic: vi.fn(() => vi.fn()),
}));

const { handleWebApp, handleWebAppHead } = await import("./web");

describe("web app fallback classification", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(fs.readFile).mockResolvedValue("<html>app</html>");
		env.APP_URL = "https://headcv.com/";
		env.VERCEL_ENV = "production";
		env.GOOGLE_SITE_VERIFICATION = undefined;
	});

	it("serves the shell for the root app route without noindex in production", async () => {
		const response = await handleWebApp(new Request("https://headcv.com/"));

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("text/html; charset=UTF-8");
		expect(response.headers.get("X-Robots-Tag")).toBeNull();
		expect(await response.text()).toBe("<html>app</html>");
	});

	it.each([
		"/auth/login",
		"/dashboard",
		"/builder/resume-1",
	])("serves noindex shell for known app prefix %s in production", async (pathname) => {
		const response = await handleWebApp(new Request(`https://headcv.com${pathname}`));

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("text/html; charset=UTF-8");
		expect(response.headers.get("X-Robots-Tag")).toBe("noindex, follow");
		expect(await response.text()).toBe("<html>app</html>");
	});

	it("serves the templates gallery indexable in production", async () => {
		const response = await handleWebApp(new Request("https://headcv.com/templates"));

		expect(response.status).toBe(200);
		expect(response.headers.get("X-Robots-Tag")).toBeNull();
		expect(await response.text()).toBe("<html>app</html>");
	});

	it("returns noindex 404 for unknown template subpaths", async () => {
		const response = await handleWebApp(new Request("https://headcv.com/templates/unknown"));

		expect(response.status).toBe(404);
	});

	it("does not send noindex for public resume paths in production", async () => {
		const response = await handleWebApp(new Request("https://headcv.com/alice/resume"));

		expect(response.status).toBe(200);
		expect(response.headers.get("X-Robots-Tag")).toBeNull();
		expect(await response.text()).toBe("<html>app</html>");
	});

	it("noindexes every fallback on non-production hosts", async () => {
		env.APP_URL = "http://localhost:3000/";
		env.VERCEL_ENV = undefined;

		const response = await handleWebApp(new Request("http://localhost:3000/"));

		expect(response.status).toBe(200);
		expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
	});

	it("noindexes every fallback on Vercel preview deployments", async () => {
		env.APP_URL = "https://headcv-git-preview.example.vercel.app/";
		env.VERCEL_ENV = "preview";

		const response = await handleWebApp(new Request("https://headcv-git-preview.example.vercel.app/"));

		expect(response.status).toBe(200);
		expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
	});

	it("injects the Google site verification meta tag when configured", async () => {
		env.GOOGLE_SITE_VERIFICATION = "abc123";
		vi.mocked(fs.readFile).mockResolvedValue(
			'<html><head><meta name="google-site-verification" content="__HEADCV_GOOGLE_SITE_VERIFICATION__"></head></html>',
		);

		const response = await handleWebApp(new Request("https://headcv.com/"));
		const text = await response.text();

		expect(text).toContain('<meta name="google-site-verification" content="abc123">');
	});

	it("returns noindex 404 for unknown non-asset routes", async () => {
		const response = await handleWebApp(new Request("https://headcv.com/unknown/extra/path"));

		expect(response.status).toBe(404);
		expect(response.headers.get("Content-Type")).toBe("text/plain; charset=UTF-8");
		expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
		expect(await response.text()).toBe("Not Found");
		expect(fs.readFile).not.toHaveBeenCalled();
	});

	it.each([
		"/api/foo",
		"/uploads/foo",
	])("does not treat reserved two-segment path %s as a public resume", async (pathname) => {
		const response = await handleWebApp(new Request(`https://headcv.com${pathname}`));

		expect(response.status).toBe(404);
		expect(response.headers.get("Content-Type")).toBe("text/plain; charset=UTF-8");
		expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
		expect(await response.text()).toBe("Not Found");
		expect(fs.readFile).not.toHaveBeenCalled();
	});

	it("returns plain 404 for missing asset-looking paths", async () => {
		const response = await handleWebApp(new Request("https://headcv.com/assets/missing.css"));

		expect(response.status).toBe(404);
		expect(response.headers.get("X-Robots-Tag")).toBeNull();
		expect(await response.text()).toBe("Not Found");
		expect(fs.readFile).not.toHaveBeenCalled();
	});

	it("mirrors fallback status and headers for HEAD without a body", async () => {
		const knownResponse = handleWebAppHead(new Request("https://headcv.com/dashboard"));
		const unknownResponse = handleWebAppHead(new Request("https://headcv.com/unknown/extra/path"));

		expect(knownResponse.status).toBe(200);
		expect(knownResponse.headers.get("Content-Type")).toBe("text/html; charset=UTF-8");
		expect(knownResponse.headers.get("X-Robots-Tag")).toBe("noindex, follow");
		expect(await knownResponse.text()).toBe("");

		expect(unknownResponse.status).toBe(404);
		expect(unknownResponse.headers.get("Content-Type")).toBe("text/plain; charset=UTF-8");
		expect(unknownResponse.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
		expect(await unknownResponse.text()).toBe("");
	});
});
