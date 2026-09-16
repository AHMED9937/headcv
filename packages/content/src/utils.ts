const PLACEHOLDER_RE = /\[([A-Za-z][A-Za-z0-9\s/]*?)\]/g;

export function listUnresolvedPlaceholders(pattern: string): string[] {
	const matches = [...pattern.matchAll(PLACEHOLDER_RE)];
	return [...new Set(matches.map((match) => match[1]).filter((value) => value !== undefined))];
}

export function resolvePlaceholders(
	pattern: string,
	values: Record<string, string>,
): { text: string; unresolved: string[] } {
	const unresolved: string[] = [];

	const text = pattern.replace(PLACEHOLDER_RE, (match, key: string) => {
		const trimmedKey = key.trim();
		const value = values[trimmedKey];

		if (!value) {
			unresolved.push(trimmedKey);
			return match;
		}

		return value;
	});

	return { text, unresolved: [...new Set(unresolved)] };
}

export function normalizeSkillName(name: string): string {
	return name.trim().toLowerCase().replace(/\s+/g, " ");
}
