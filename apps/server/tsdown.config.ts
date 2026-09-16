import { readFileSync } from "node:fs";
import { defineConfig } from "tsdown";

const rootPackageJson = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf-8")) as {
	version?: string;
};

const shouldExternalize = (id: string) => {
	// Workspace packages are source-consumed through export maps; keep them as package imports.
	if (id.startsWith("@headcv/")) return true;
	// Source-relative imports are bundled.
	if (id.startsWith("@/") || id.startsWith(".") || id.startsWith("/") || id.startsWith("\0")) return false;
	// Third-party dependencies are externalized.
	return true;
};

export default defineConfig({
	entry: { index: "src/index.ts" },
	format: "esm",
	platform: "node",
	target: "node24",
	outDir: "dist",
	clean: true,
	shims: true,
	dts: false,
	define: { __APP_VERSION__: JSON.stringify(rootPackageJson.version ?? "0.0.0") },
	outExtensions: () => ({ js: ".mjs" }),
	deps: {
		neverBundle: shouldExternalize,
	},
});
