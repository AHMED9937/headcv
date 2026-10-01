import type { IconName } from "../icons";

export type SocialLink = {
	key: string;
	label: string;
	icon: IconName;
	hosts?: string[];
};

export const GENERIC_LINK_ICON: IconName = "globe";

export const socialLinks: readonly SocialLink[] = [
	{ key: "website", label: "Website", icon: "globe" },
	{ key: "portfolio", label: "Portfolio", icon: "briefcase" },
	{ key: "linkedin", label: "LinkedIn", icon: "linkedin-logo", hosts: ["linkedin.com", "lnkd.in"] },
	{ key: "github", label: "GitHub", icon: "github-logo", hosts: ["github.com"] },
	{ key: "gitlab", label: "GitLab", icon: "gitlab-logo", hosts: ["gitlab.com"] },
	{ key: "bitbucket", label: "Bitbucket", icon: "git-branch", hosts: ["bitbucket.org"] },
	{ key: "x", label: "X", icon: "x-logo", hosts: ["x.com", "twitter.com"] },
	{ key: "threads", label: "Threads", icon: "threads-logo", hosts: ["threads.net"] },
	{ key: "mastodon", label: "Mastodon", icon: "mastodon-logo", hosts: ["mastodon.social"] },
	{ key: "bluesky", label: "Bluesky", icon: "butterfly", hosts: ["bsky.app"] },
	{ key: "facebook", label: "Facebook", icon: "facebook-logo", hosts: ["facebook.com", "fb.com"] },
	{ key: "instagram", label: "Instagram", icon: "instagram-logo", hosts: ["instagram.com"] },
	{ key: "youtube", label: "YouTube", icon: "youtube-logo", hosts: ["youtube.com", "youtu.be"] },
	{ key: "tiktok", label: "TikTok", icon: "tiktok-logo", hosts: ["tiktok.com"] },
	{ key: "twitch", label: "Twitch", icon: "twitch-logo", hosts: ["twitch.tv"] },
	{ key: "discord", label: "Discord", icon: "discord-logo", hosts: ["discord.gg", "discord.com"] },
	{ key: "telegram", label: "Telegram", icon: "telegram-logo", hosts: ["t.me", "telegram.me"] },
	{ key: "whatsapp", label: "WhatsApp", icon: "whatsapp-logo", hosts: ["wa.me", "whatsapp.com"] },
	{ key: "signal", label: "Signal", icon: "chat-circle", hosts: ["signal.me"] },
	{ key: "wechat", label: "WeChat", icon: "wechat-logo" },
	{ key: "snapchat", label: "Snapchat", icon: "snapchat-logo", hosts: ["snapchat.com"] },
	{ key: "pinterest", label: "Pinterest", icon: "pinterest-logo", hosts: ["pinterest.com"] },
	{ key: "reddit", label: "Reddit", icon: "reddit-logo", hosts: ["reddit.com"] },
	{ key: "medium", label: "Medium", icon: "medium-logo", hosts: ["medium.com"] },
	{ key: "substack", label: "Substack", icon: "newspaper", hosts: ["substack.com"] },
	{ key: "devto", label: "dev.to", icon: "dev-to-logo", hosts: ["dev.to"] },
	{ key: "hashnode", label: "Hashnode", icon: "pen-nib", hosts: ["hashnode.com", "hashnode.dev"] },
	{ key: "stackoverflow", label: "Stack Overflow", icon: "stack-overflow-logo", hosts: ["stackoverflow.com"] },
	{ key: "behance", label: "Behance", icon: "behance-logo", hosts: ["behance.net"] },
	{ key: "dribbble", label: "Dribbble", icon: "dribbble-logo", hosts: ["dribbble.com"] },
	{ key: "figma", label: "Figma", icon: "figma-logo", hosts: ["figma.com"] },
	{ key: "codepen", label: "CodePen", icon: "codepen-logo", hosts: ["codepen.io"] },
	{ key: "replit", label: "Replit", icon: "replit-logo", hosts: ["replit.com"] },
	{ key: "leetcode", label: "LeetCode", icon: "code", hosts: ["leetcode.com"] },
	{ key: "hackerrank", label: "HackerRank", icon: "code", hosts: ["hackerrank.com"] },
	{ key: "kaggle", label: "Kaggle", icon: "chart-bar", hosts: ["kaggle.com"] },
	{ key: "huggingface", label: "Hugging Face", icon: "robot", hosts: ["huggingface.co"] },
	{ key: "orcid", label: "ORCID", icon: "identification-badge", hosts: ["orcid.org"] },
	{ key: "researchgate", label: "ResearchGate", icon: "flask", hosts: ["researchgate.net"] },
	{ key: "googlescholar", label: "Google Scholar", icon: "graduation-cap", hosts: ["scholar.google.com"] },
	{ key: "spotify", label: "Spotify", icon: "spotify-logo", hosts: ["spotify.com"] },
	{ key: "soundcloud", label: "SoundCloud", icon: "soundcloud-logo", hosts: ["soundcloud.com"] },
	{ key: "bandcamp", label: "Bandcamp", icon: "vinyl-record", hosts: ["bandcamp.com"] },
	{ key: "goodreads", label: "Goodreads", icon: "goodreads-logo", hosts: ["goodreads.com"] },
	{ key: "letterboxd", label: "Letterboxd", icon: "film-slate", hosts: ["letterboxd.com"] },
	{ key: "imdb", label: "IMDb", icon: "film-reel", hosts: ["imdb.com"] },
	{ key: "tumblr", label: "Tumblr", icon: "tumblr-logo", hosts: ["tumblr.com"] },
	{ key: "patreon", label: "Patreon", icon: "patreon-logo", hosts: ["patreon.com"] },
	{ key: "paypal", label: "PayPal", icon: "paypal-logo", hosts: ["paypal.com", "paypal.me"] },
	{ key: "calendly", label: "Calendly", icon: "calendar-dots", hosts: ["calendly.com"] },
	{ key: "linktree", label: "Linktree", icon: "linktree-logo", hosts: ["linktr.ee"] },
	{ key: "notion", label: "Notion", icon: "notion-logo", hosts: ["notion.so", "notion.site"] },
	{ key: "upwork", label: "Upwork", icon: "briefcase", hosts: ["upwork.com"] },
	{ key: "fiverr", label: "Fiverr", icon: "briefcase", hosts: ["fiverr.com"] },
	{ key: "freelancer", label: "Freelancer", icon: "briefcase", hosts: ["freelancer.com"] },
	{ key: "angellist", label: "AngelList", icon: "rocket-launch", hosts: ["angel.co", "wellfound.com"] },
	{ key: "indeed", label: "Indeed", icon: "briefcase", hosts: ["indeed.com"] },
	{ key: "xing", label: "Xing", icon: "briefcase", hosts: ["xing.com"] },
	{ key: "credly", label: "Credly", icon: "certificate", hosts: ["credly.com"] },
	{ key: "coursera", label: "Coursera", icon: "graduation-cap", hosts: ["coursera.org"] },
	{ key: "udemy", label: "Udemy", icon: "graduation-cap", hosts: ["udemy.com"] },
	{ key: "khanacademy", label: "Khan Academy", icon: "graduation-cap", hosts: ["khanacademy.org"] },
	{ key: "gmail", label: "Gmail", icon: "envelope-simple", hosts: ["mail.google.com"] },
	{ key: "protonmail", label: "Proton Mail", icon: "envelope-simple", hosts: ["proton.me"] },
	{ key: "strava", label: "Strava", icon: "person-simple-run", hosts: ["strava.com"] },
	{ key: "steam", label: "Steam", icon: "steam-logo", hosts: ["steamcommunity.com"] },
	{ key: "npm", label: "npm", icon: "package", hosts: ["npmjs.com"] },
];

const hostIndex: ReadonlyMap<string, IconName> = new Map(
	socialLinks.flatMap((link) => (link.hosts ?? []).map((host) => [host, link.icon] as const)),
);

const labelIndex: ReadonlyMap<string, IconName> = new Map(
	socialLinks.flatMap((link) => [
		[link.key.toLowerCase(), link.icon] as const,
		[link.label.toLowerCase(), link.icon] as const,
	]),
);

export function iconForUrl(url: string): IconName | "" {
	if (!url) return "";
	let host: string;
	try {
		host = new URL(url.includes("://") ? url : `https://${url}`).hostname.toLowerCase().replace(/^www\./, "");
	} catch {
		return "";
	}
	for (const [candidate, icon] of hostIndex) {
		if (host === candidate || host.endsWith(`.${candidate}`)) return icon;
	}
	return "";
}

export function iconForNetwork(name: string): IconName | "" {
	if (!name) return "";
	return labelIndex.get(name.trim().toLowerCase()) ?? "";
}

export function resolveLinkIcon(network: string | undefined, url: string | undefined): IconName {
	return iconForNetwork(network ?? "") || iconForUrl(url ?? "") || GENERIC_LINK_ICON;
}
