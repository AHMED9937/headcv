import { isAbsolute, join } from "node:path";
import { createEnv } from "@t3-oss/env-core";
import { config } from "dotenv";
import { z } from "zod";
import { findWorkspaceRoot } from "@headcv/utils/monorepo.node";

const workspaceRoot = findWorkspaceRoot();

if (workspaceRoot) {
	config({ path: join(workspaceRoot, ".env"), quiet: true });
}

const stripQuotes = (value: string | undefined) => {
	if (value === undefined) return value;
	if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
		return value.slice(1, -1);
	}
	return value;
};

const runtimeEnv = Object.fromEntries(
	Object.entries(process.env).map(([key, value]) => [key, typeof value === "string" ? stripQuotes(value) : value]),
);

export const env = createEnv({
	server: {
		// Application
		APP_URL: z.url({ protocol: /https?/ }),
		SERVER_PORT: z.coerce.number().int().min(1).max(65535).default(3001),

		// Database
		DATABASE_URL: z.url({ protocol: /postgres(ql)?/ }),
		// Optional direct (unpooled) URL used by migrations and admin tasks.
		// Falls back to DATABASE_URL when not set.
		DATABASE_URL_UNPOOLED: z.url({ protocol: /postgres(ql)?/ }).optional(),
		DATABASE_POOL_MIN: z.coerce.number().int().min(0).default(0),
		DATABASE_POOL_MAX: z.coerce.number().int().min(1).default(10),

		// Authentication
		AUTH_SECRET: z.string().min(1),
		BETTER_AUTH_API_KEY: z.string().min(1).optional(),

		// Social Auth (Google)
		GOOGLE_CLIENT_ID: z.string().min(1).optional(),
		GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),

		// Social Auth (GitHub)
		GITHUB_CLIENT_ID: z.string().min(1).optional(),
		GITHUB_CLIENT_SECRET: z.string().min(1).optional(),

		// Social Auth (LinkedIn)
		LINKEDIN_CLIENT_ID: z.string().min(1).optional(),
		LINKEDIN_CLIENT_SECRET: z.string().min(1).optional(),

		// Custom OAuth Provider
		OAUTH_PROVIDER_NAME: z.string().min(1).optional(),
		OAUTH_CLIENT_ID: z.string().min(1).optional(),
		OAUTH_CLIENT_SECRET: z.string().min(1).optional(),
		OAUTH_DISCOVERY_URL: z.url({ protocol: /https?/ }).optional(),
		OAUTH_AUTHORIZATION_URL: z.url({ protocol: /https?/ }).optional(),
		OAUTH_TOKEN_URL: z.url({ protocol: /https?/ }).optional(),
		OAUTH_USER_INFO_URL: z.url({ protocol: /https?/ }).optional(),
		OAUTH_SCOPES: z
			.string()
			.min(1)
			.transform((value) => value.split(" "))
			.default(["openid", "profile", "email"]),

		// Email (SMTP)
		SMTP_HOST: z.string().min(1).optional(),
		SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
		SMTP_USER: z.string().min(1).optional(),
		SMTP_PASS: z.string().min(1).optional(),
		SMTP_FROM: z.string().min(1).optional(),
		SMTP_SECURE: z.stringbool().default(false),

		// Storage (Optional)
		LOCAL_STORAGE_PATH: z.string().min(1).refine(isAbsolute, "LOCAL_STORAGE_PATH must be an absolute path").optional(),
		S3_ACCESS_KEY_ID: z.string().min(1).optional(),
		S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
		S3_REGION: z.string().default("us-east-1"),
		S3_ENDPOINT: z.url({ protocol: /https?/ }).optional(),
		S3_BUCKET: z.string().min(1).optional(),
		S3_FORCE_PATH_STYLE: z.stringbool().default(false),

		// AI Agent Workspace (optional until the agent feature is used)
		REDIS_URL: z.url({ protocol: /redis(s)?/ }).optional(),
		ENCRYPTION_SECRET: z.string().min(32, "ENCRYPTION_SECRET must be at least 32 characters").optional(),

		// Global AI Provider (managed via .env, not per-user)
		AI_PROVIDER: z.string().min(1).optional(),
		AI_MODEL: z.string().min(1).optional(),
		AI_BASE_URL: z.string().min(1).optional(),
		AI_API_KEY: z.string().min(1).optional(),

		// Feature Flags
		FLAG_DISABLE_SIGNUPS: z.stringbool().default(false),
		FLAG_DISABLE_EMAIL_AUTH: z.stringbool().default(false),
		FLAG_DISABLE_IMAGE_PROCESSING: z.stringbool().default(false),
		FLAG_ALLOW_UNSAFE_AI_BASE_URL: z.stringbool().default(false),
		FLAG_ALLOW_UNSAFE_OAUTH_REDIRECT_URI: z.stringbool().default(false),

		// SEO / Prerendering (optional)
		// Point this at a prerender service (e.g. https://service.prerender.io for Prerender.io,
		// or a self-hosted Rendertron instance) to serve static HTML snapshots to search/AI crawlers.
		PRERENDER_SERVICE_URL: z.string().min(1).url().optional(),
		PRERENDER_TOKEN: z.string().min(1).optional(),

		// Crowdin (optional, for translation tooling)
		CROWDIN_PROJECT_ID: z.string().optional(),
		CROWDIN_API_TOKEN: z.string().optional(),
		GOOGLE_CLOUD_API_KEY: z.string().optional(),
	},
	runtimeEnv,
	emptyStringAsUndefined: true,
});
