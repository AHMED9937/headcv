import { describe, expect, it } from "vitest";
import { diffText } from "./diff";

describe("diffText", () => {
	it("returns a single equal part for identical strings", () => {
		const result = diffText("hello", "hello");
		expect(result).toEqual([{ type: "equal", value: "hello" }]);
	});

	it("detects additions and removals", () => {
		const result = diffText("hello world", "hi world");
		const types = result.map((part) => part.type);
		expect(types).toContain("remove");
		expect(types).toContain("add");
		expect(types).toContain("equal");
	});

	it("treats nullish values as empty strings", () => {
		expect(diffText(null, "new")).toEqual([{ type: "add", value: "new" }]);
		expect(diffText("old", undefined)).toEqual([{ type: "remove", value: "old" }]);
	});
});
