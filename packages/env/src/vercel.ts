type VercelRuntimeEnv = {
	APP_URL?: string | undefined;
	VERCEL_ENV?: string | undefined;
	VERCEL_URL?: string | undefined;
	VERCEL_BRANCH_URL?: string | undefined;
};

const toHttpsOrigin = (host: string) => `https://${host.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;

/**
 * Vercel preview deployments get a fresh URL per deployment, so APP_URL cannot be pinned for them.
 * Falls back to the deployment URL (the one GitHub and Vercel link to) only on previews.
 */
export function resolveAppUrl(env: VercelRuntimeEnv): string | undefined {
	if (env.APP_URL) return env.APP_URL;
	if (env.VERCEL_ENV !== "preview") return undefined;

	const host = env.VERCEL_URL || env.VERCEL_BRANCH_URL;
	return host ? toHttpsOrigin(host) : undefined;
}

/** Every origin a preview deployment answers on (deployment URL and branch alias), for auth origin checks. */
export function getVercelPreviewOrigins(env: VercelRuntimeEnv): string[] {
	if (env.VERCEL_ENV !== "preview") return [];

	const hosts = [env.VERCEL_URL, env.VERCEL_BRANCH_URL].filter((host): host is string => Boolean(host));
	return [...new Set(hosts.map(toHttpsOrigin))];
}
