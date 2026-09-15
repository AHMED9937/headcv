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
const nativeDepsDir = mkdtempSync(join(tmpdir(), "nexacv-native-"));
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
mkdirSync(join(serverFuncDir, "apps", "web", "dist"), { recursive: true });
cpSync(webDist, join(serverFuncDir, "apps", "web", "dist"), { recursive: true, force: true });

// Function configuration.
writeFileSync(
	join(serverFuncDir, ".vc-config.json"),
	JSON.stringify({
		runtime: "nodejs24.x",
		handler: "index.mjs",
		maxDuration: 300,
	}),
);

// Global routing table.
writeFileSync(
	join(outDir, "config.json"),
	JSON.stringify({
		version: 3,
		routes: [
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
	}),
);
