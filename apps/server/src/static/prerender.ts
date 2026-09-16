import { env } from "@headcv/env/server";

const crawlerUserAgents = [
	"googlebot",
	"bingbot",
	"yandex",
	"baiduspider",
	"duckduckbot",
	"facebookexternalhit",
	"twitterbot",
	"linkedinbot",
	"whatsapp",
	"slackbot",
	"discordbot",
	"telegrambot",
	"applebot",
	"gptbot",
	"chatgpt-user",
	"perplexitybot",
	"perplexity",
	"claudebot",
	"anthropic-ai",
];

const htmlLikeExtensions = new Set(["", ".html"]);

function isCrawlerRequest(request: Request): boolean {
	const userAgent = request.headers.get("user-agent") ?? "";
	const lower = userAgent.toLowerCase();
	return crawlerUserAgents.some((agent) => lower.includes(agent));
}

function getPathExtension(pathname: string): string {
	const lastSegment = pathname.split("/").pop() ?? "";
	const dotIndex = lastSegment.lastIndexOf(".");
	return dotIndex === -1 ? "" : lastSegment.slice(dotIndex).toLowerCase();
}

function shouldPrerender(pathname: string): boolean {
	return htmlLikeExtensions.has(getPathExtension(pathname));
}

export async function handlePrerender(request: Request): Promise<Response | null> {
	if (!env.PRERENDER_SERVICE_URL) return null;
	if (!isCrawlerRequest(request)) return null;

	const incoming = new URL(request.url);
	if (!shouldPrerender(incoming.pathname)) return null;

	const target = new URL(incoming.pathname, env.APP_URL);
	target.search = incoming.search;

	const prerenderUrl = `${env.PRERENDER_SERVICE_URL.replace(/\/$/, "")}/${encodeURIComponent(target.toString())}`;
	const headers = new Headers();
	if (env.PRERENDER_TOKEN) headers.set("X-Prerender-Token", env.PRERENDER_TOKEN);

	try {
		const response = await fetch(prerenderUrl, { headers, method: request.method === "HEAD" ? "GET" : request.method });
		if (!response.ok) return null;

		const body = request.method === "HEAD" ? null : await response.arrayBuffer();

		return new Response(body, {
			status: response.status,
			headers: {
				"Content-Type": "text/html; charset=UTF-8",
				"Cache-Control": response.headers.get("Cache-Control") ?? "public, max-age=86400",
			},
		});
	} catch {
		return null;
	}
}
