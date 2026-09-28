import { env } from "@headcv/env/server";

const DOCS_URL = "https://docs.headcv.com";

type StaticSeoOptions = {
	head?: boolean;
};

function appUrl() {
	return env.APP_URL.replace(/\/+$/, "");
}

function textResponse(body: string, options: StaticSeoOptions = {}) {
	return new Response(options.head ? null : body, {
		headers: { "Content-Type": "text/plain; charset=UTF-8" },
	});
}

export function handleRobots(options?: StaticSeoOptions) {
	const baseUrl = appUrl();
	const body = [
		"User-agent: *",
		"Allow: /",
		"Disallow: /api/rpc",
		"Disallow: /api/auth",
		"Disallow: /.well-known",
		"",
		`Sitemap: ${baseUrl}/sitemap.xml`,
		`Sitemap: ${DOCS_URL}/sitemap.xml`,
		"",
	].join("\n");

	return textResponse(body, options);
}

export function handleSitemap(options?: StaticSeoOptions) {
	const baseUrl = appUrl();
	const body = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		"  <url>",
		`    <loc>${baseUrl}/</loc>`,
		"  </url>",
		"  <url>",
		`    <loc>${baseUrl}/templates</loc>`,
		"  </url>",
		"</urlset>",
		"",
	].join("\n");

	return new Response(options?.head ? null : body, {
		headers: { "Content-Type": "application/xml; charset=UTF-8" },
	});
}

export function handleLlms(options?: StaticSeoOptions) {
	const baseUrl = appUrl();
	const body = [
		"# HeadCV",
		"",
		"> HeadCV is a free, open-source resume builder that helps job seekers create ATS-friendly, professional CVs with guided editing, curated phrasing, live preview, and instant PDF export.",
		"",
		"HeadCV supports English (LTR) and Arabic (RTL) layouts, offers a growing library of resume templates, and lets users start building immediately without an account. Accounts are only required when saving multiple resumes or syncing across devices.",
		"",
		"## Product",
		"",
		`- Guided CV builder: ${baseUrl}/`,
		"  Build a resume step-by-step with smart defaults and real-time preview.",
		`- Resume templates: ${baseUrl}/templates`,
		"  Browse ATS-friendly, modern, professional, and creative CV designs.",
		`- Public resume sharing: ${baseUrl}/<username>/<slug>`,
		"  Share a polished, public version of a resume with a unique URL.",
		`- PDF export: ${baseUrl}/<username>/<slug>`,
		"  Download a resume as a professional, print-ready PDF.",
		"",
		"## Resources",
		"",
		`- Documentation: ${DOCS_URL}`,
		"  User guides, developer setup, and feature documentation.",
		`- API / OpenAPI: ${baseUrl}/api/openapi/spec.json`,
		"  Machine-readable API specification for integrations.",
		`- Resume schema: ${baseUrl}/schema.json`,
		"  JSON schema describing the HeadCV resume data model.",
		"- Source code: https://github.com/AHMED9937/headcv",
		"  Open-source repository under the MIT license.",
		"",
		"## Optional",
		"",
		`- Documentation sitemap: ${DOCS_URL}/sitemap.xml`,
		"  Machine-readable index of all documentation pages.",
		"",
	].join("\n");

	return textResponse(body, options);
}
