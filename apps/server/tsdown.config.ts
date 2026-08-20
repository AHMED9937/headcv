import { readFileSync } from "node:fs";
import { defineConfig } from "tsdown";

const rootPackageJson = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf-8")) as {
	version?: string;
};

const shouldExternalizeThirdParty = (id: string) => {
	if (id.startsWith("@reactive-resume/")) return false;
	if (id.startsWith("@/") || id.startsWith(".") || id.startsWith("/") || id.startsWith("\0")) return false;

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
		alwaysBundle: [/^@reactive-resume\//],
		neverBundle: shouldExternalizeThirdParty,
	},
});
