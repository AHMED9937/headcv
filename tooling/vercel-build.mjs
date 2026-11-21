import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, ".vercel", "output");
const serverFuncDir = join(outDir, "functions", "server.func");
const webDist = join(root, "apps", "web", "dist");
const serverPackage = join(root, "apps", "server");

const appVersion = JSON.parse(readFileSync(join(root, "package.json"), "utf-8")).version ?? "0.0.0";

if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
mkdirSync(serverFuncDir, { recursive: true });

// Build the frontend for Vercel's CDN directly with Vite so pnpm does not try
// to reinstall dependencies while building.
execSync("pnpm --filter web exec vite build --emptyOutDir", { cwd: root, stdio: "inherit", shell: true });

// Vercel serves the SPA shell straight from the CDN, so the Google Search
// Console token must be baked into index.html at build time. The same sentinel
// is still replaced at runtime by apps/server for the container/Docker path.
const indexHtmlPath = join(webDist, "index.html");
writeFileSync(
	indexHtmlPath,
	readFileSync(indexHtmlPath, "utf-8").replaceAll(
		"__HEADCV_GOOGLE_SITE_VERIFICATION__",
		process.env.GOOGLE_SITE_VERIFICATION ?? "",
	),
);

// Bundle the server function into a single ESM file.
const serverBundle = join(serverFuncDir, "index.mjs");
const esbuildArgs = [
	"src/vercel.ts",
	"--bundle",
	"--platform=node",
	"--target=node24",
	"--format=esm",
	`--outfile=${serverBundle}`,
	"--external:bcrypt",
	"--external:sharp",
];
execSync(`pnpm exec esbuild ${esbuildArgs.join(" ")}`, { cwd: serverPackage, stdio: "inherit", shell: true });

// CommonJS dependencies inside the bundle (dotenv, node-forge, etc.) use
// require() for Node built-ins. ESM functions do not define `require`, so
// prepend a module-level createRequire and __APP_VERSION__ before esbuild's
// helper code.
const requireBanner = 'import { createRequire } from "node:module";\nvar require = createRequire(import.meta.url);\n';
const versionBanner = `var __APP_VERSION__ = ${JSON.stringify(appVersion)};\n`;
writeFileSync(serverBundle, requireBanner + versionBanner + readFileSync(serverBundle, "utf-8"));

// Install native-only runtime dependencies into a temporary directory (away
// from the repo's pnpm-only .npmrc) and copy the resulting node_modules tree
// into the function so the bundled ESM can resolve bcrypt/sharp .node binaries.
const nativeDepsDir = mkdtempSync(join(tmpdir(), "headcv-native-"));
execSync("npm install bcrypt@6.0.0 sharp@0.34.5", {
	cwd: nativeDepsDir,
	stdio: "inherit",
	shell: true,
});
cpSync(join(nativeDepsDir, "node_modules"), join(serverFuncDir, "node_modules"), { recursive: true, force: true });
rmSync(nativeDepsDir, { recursive: true, force: true });

// Static assets are served from Vercel's CDN.
mkdirSync(join(outDir, "static"), { recursive: true });
cpSync(webDist, join(outDir, "static"), { recursive: true, force: true });

// Migrations, AI prompts, and the SPA dist are referenced via import.meta.url
// or process.cwd() at runtime, so keep them next to the bundle.
const migrationsDir = join(root, "migrations");
if (existsSync(migrationsDir)) {
	cpSync(migrationsDir, join(serverFuncDir, "migrations"), { recursive: true, force: true });
}
const promptsDir = join(root, "packages", "ai", "src", "prompts");
if (existsSync(promptsDir)) {
	cpSync(promptsDir, join(serverFuncDir, "prompts"), { recursive: true, force: true });
}
// Only copy index.html for the SPA fallback — the CDN serves all other assets.
mkdirSync(join(serverFuncDir, "apps", "web", "dist"), { recursive: true });
cpSync(join(webDist, "index.html"), join(serverFuncDir, "apps", "web", "dist", "index.html"));

// Function configuration. Mirror what Vercel's own Node/Hono builder emits:
// without `launcherType: "Nodejs"`, @vercel/build-utils deserializes the
// function as a generic Lambda rather than a Node.js one. With only
// runtime/handler set, usage was billed as legacy wall-clock Function
// Duration even though Fluid compute was enabled for the project.
writeFileSync(
	join(serverFuncDir, ".vc-config.json"),
	JSON.stringify({
		runtime: "nodejs24.x",
		handler: "index.mjs",
		launcherType: "Nodejs",
		shouldAddHelpers: true,
		supportsResponseStreaming: true,
		maxDuration: 60,
	}),
);

// Global routing table. Private app shells get an explicit noindex header and
// non-production builds noindex every response, since the CDN serves the SPA
// shell without ever hitting the server function's robots logic.
const noindexRoutes = [
	...(process.env.VERCEL_ENV === "production"
		? []
		: [
				{
					src: "^/.*$",
					headers: { "x-robots-tag": "noindex, nofollow" },
					continue: true,
				},
			]),
	{
		src: "^/(?:auth|dashboard|builder)(?:/.*)?$",
		headers: { "x-robots-tag": "noindex, follow" },
		continue: true,
	},
];

writeFileSync(
	join(outDir, "config.json"),
	JSON.stringify({
		version: 3,
		routes: [
			...noindexRoutes,
			{
				handle: "filesystem",
			},
			{
				src: "/(?:api|uploads|\\.well-known|mcp)(?:/.*)?",
				dest: "/server",
			},
			{
				src: "/(?:schema\\.json|robots\\.txt|sitemap\\.xml|llms\\.txt)",
				dest: "/server",
			},
			{
				src: "/.*",
				dest: "/index.html",
				check: true,
			},
		],
		// Vercel Cron (Build Output API): daily works on every plan. Ends one-time 7-day trial passes and
		// sends their "trial ended" email; access itself already ends on time without it.
		crons: [{ path: "/api/cron/trial-pass", schedule: "0 8 * * *" }],
	}),
);

// Apply pending database migrations after everything above built successfully.
// The serverless entry never runs the startup migrator, so this is the only
// automatic path; a failure fails the deploy and the previous version stays live.
// Migrations must stay additive (expand, then contract later).
// Previews migrate only when MIGRATE_PREVIEW_DATABASE=true, which must be set only
// once Neon gives each preview its own database branch: without branching, a
// preview's DATABASE_URL is the production database.
const shouldMigrate =
	process.env.VERCEL_ENV === "production" ||
	(process.env.VERCEL_ENV === "preview" && process.env.MIGRATE_PREVIEW_DATABASE === "true");
if (shouldMigrate) {
	execSync("pnpm --filter @headcv/db exec drizzle-kit migrate", { cwd: root, stdio: "inherit", shell: true });
}
