import { describe, expect, it } from "vitest";
import { getReadableSmallTextSize } from "./styles";

describe("getReadableSmallTextSize", () => {
	it("enforces a readable 10pt floor", () => {
		expect(getReadableSmallTextSize(8.75)).toBe(10);
	});

	it("preserves larger configured text", () => {
		expect(getReadableSmallTextSize(11)).toBe(11);
	});
});
