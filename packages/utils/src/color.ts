type RgbaColor = {
	r: number;
	g: number;
	b: number;
	a: number;
};

export function rgbaStringToHex(rgba: string): string {
	const color = parseColorString(rgba);
	if (color) return `#${toHexComponent(color.r)}${toHexComponent(color.g)}${toHexComponent(color.b)}`;

	const fallback = parseRgbaString(rgba);
	if (fallback) return `#${toHexComponent(fallback.r)}${toHexComponent(fallback.g)}${toHexComponent(fallback.b)}`;

	// Match the previous fallback behavior: unparseable strings become black.
	return "#000000";
}

function toHexComponent(value: number): string {
	return Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0");
}

function parseComponent(value: string, isPercent: boolean | undefined): number {
	const num = Number(value);
	if (isPercent) return Math.round(num * (255 / 100));
	return num;
}

function parseRgbaString(value: string): RgbaColor | null {
	// Permissive rgb/rgba parser supporting comma/space separators,
	// optional parentheses, percentage values, and alpha as a number or percent.
	const match = value.match(
		/^rgba?\(?\s*(-?\d*\.?\d+)(%?)[,\s]+(-?\d*\.?\d+)(%?)[,\s]+(-?\d*\.?\d+)(%?),?\s*[/\s]*(-?\d*\.?\d+)?(%?)\s*\)?$/i,
	);

	if (!match) return null;

	return {
		r: parseComponent(match[1] ?? "0", !!match[2]),
		g: parseComponent(match[3] ?? "0", !!match[4]),
		b: parseComponent(match[5] ?? "0", !!match[6]),
		a: match[7] === undefined ? 1 : parseComponent(match[7], !!match[8]),
	};
}

export function parseColorString(value: string): RgbaColor | null {
	const trimmed = value.trim();

	// Parse rgb/rgba colors
	const rgbMatch = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/);

	if (rgbMatch) {
		return {
			r: Number.parseInt(rgbMatch[1] ?? "0", 10),
			g: Number.parseInt(rgbMatch[2] ?? "0", 10),
			b: Number.parseInt(rgbMatch[3] ?? "0", 10),
			a: rgbMatch[4] ? Number.parseFloat(rgbMatch[4]) : 1,
		};
	}

	// Parse hex colors (convert to RGB)
	if (trimmed.startsWith("#")) {
		const hexMatch = trimmed.match(/^#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})$/i);
		if (hexMatch) {
			return {
				r: Number.parseInt(hexMatch[1] ?? "0", 16),
				g: Number.parseInt(hexMatch[2] ?? "0", 16),
				b: Number.parseInt(hexMatch[3] ?? "0", 16),
				a: 1,
			};
		}

		// Support 3-digit hex
		const hexMatch3 = trimmed.match(/^#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])$/i);
		if (hexMatch3) {
			return {
				r: Number.parseInt((hexMatch3[1] ?? "0") + (hexMatch3[1] ?? "0"), 16),
				g: Number.parseInt((hexMatch3[2] ?? "0") + (hexMatch3[2] ?? "0"), 16),
				b: Number.parseInt((hexMatch3[3] ?? "0") + (hexMatch3[3] ?? "0"), 16),
				a: 1,
			};
		}
	}

	return null;
}
