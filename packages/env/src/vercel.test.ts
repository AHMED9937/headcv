import { describe, expect, it } from "vitest";
import { getVercelPreviewOrigins, resolveAppUrl } from "./vercel";

const preview = {
	VERCEL_ENV: "preview",
	VERCEL_URL: "headcv-abc123-team.vercel.app",
	VERCEL_BRANCH_URL: "headcv-git-feature-team.vercel.app",
};

describe("resolveAppUrl", () => {
	it("keeps an explicitly configured APP_URL", () => {
		expect(resolveAppUrl({ ...preview, APP_URL: "https://preview.example.com" })).toBe("https://preview.example.com");
	});

	it("derives the deployment URL on Vercel previews", () => {
		expect(resolveAppUrl(preview)).toBe("https://headcv-abc123-team.vercel.app");
	});

	it("falls back to the branch URL when the deployment URL is missing", () => {
		expect(resolveAppUrl({ ...preview, VERCEL_URL: undefined })).toBe("https://headcv-git-feature-team.vercel.app");
	});

	it("never derives APP_URL outside previews, so production must stay explicitly configured", () => {
		expect(resolveAppUrl({ ...preview, VERCEL_ENV: "production" })).toBeUndefined();
		expect(resolveAppUrl({ VERCEL_URL: "headcv-abc123-team.vercel.app" })).toBeUndefined();
	});
});

describe("getVercelPreviewOrigins", () => {
	it("trusts both the deployment URL and the branch alias on previews", () => {
		expect(getVercelPreviewOrigins(preview)).toEqual([
			"https://headcv-abc123-team.vercel.app",
			"https://headcv-git-feature-team.vercel.app",
		]);
	});

	it("adds nothing outside previews", () => {
		expect(getVercelPreviewOrigins({ ...preview, VERCEL_ENV: "production" })).toEqual([]);
	});
});
