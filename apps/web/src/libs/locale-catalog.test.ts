import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const catalogPath = (locale: string) => fileURLToPath(new URL(`../../locales/${locale}.po`, import.meta.url));

/** Active (non-obsolete) msgids whose msgstr is empty. */
function untranslatedMessages(locale: string): string[] {
	const entries = readFileSync(catalogPath(locale), "utf8").replaceAll("\r\n", "\n").split("\n\n");

	return entries.flatMap((entry) => {
		const id = /^msgid "(.*)"$/m.exec(entry)?.[1];
		if (!id) return []; // header entry or obsolete (#~) entry
		return /^msgstr ""$/m.test(entry) && !/^"/m.test(entry.split(/^msgstr/m)[1] ?? "") ? [id] : [];
	});
}

describe("Arabic catalog", () => {
	it("translates every message the app uses", () => {
		expect(untranslatedMessages("ar-SA")).toEqual([]);
	});
});
