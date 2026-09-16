import diff from "fast-diff";

export type DiffPartType = "equal" | "add" | "remove";

export type DiffPart = {
	type: DiffPartType;
	value: string;
};

const OP_MAP: Record<number, DiffPartType> = {
	[-1]: "remove",
	0: "equal",
	1: "add",
};

/**
 * Computes a character-level diff between two strings.
 *
 * Returns an array of parts tagged as `equal`, `add`, or `remove`.
 * `fast-diff` uses -1 for deletion, 0 for equality, and 1 for insertion.
 */
export function diffText(before: string | null | undefined, after: string | null | undefined): DiffPart[] {
	const raw = diff(String(before ?? ""), String(after ?? ""));
	return raw.map(([op, value]) => ({ type: OP_MAP[op] ?? "equal", value }));
}
