import { defineConfig } from "@lingui/cli";
import { formatter } from "@lingui/format-po";

const catalogCollator = new Intl.Collator("en-US");
const poFormatter = formatter({
	lineNumbers: false,
});

const deterministicPoFormatter = {
	...poFormatter,
	serialize(
		catalog: Parameters<typeof poFormatter.serialize>[0],
		context: Parameters<typeof poFormatter.serialize>[1],
	) {
		const sortedCatalog = Object.fromEntries(
			Object.entries(catalog).sort(([leftId, left], [rightId, right]) => {
				const messageOrder = catalogCollator.compare(left.message ?? "", right.message ?? "");
				if (messageOrder !== 0) return messageOrder;

				const contextOrder = catalogCollator.compare(left.context ?? "", right.context ?? "");
				if (contextOrder !== 0) return contextOrder;
				if (!left.message || !right.message) return 0;

				// Lingui's default comparator has no final tie-breaker, so duplicate messages inherit OS-dependent file order.
				if (leftId < rightId) return -1;
				if (leftId > rightId) return 1;
				return 0;
			}),
		);

		return poFormatter.serialize(sortedCatalog, context);
	},
};

export default defineConfig({
	sourceLocale: "en-US",
	locales: ["ar-SA", "en-US"],
	fallbackLocales: {
		default: "en-US",
	},
	format: deterministicPoFormatter,
	catalogs: [
		{
			path: "<rootDir>/locales/{locale}",
			include: ["src"],
		},
	],
});
