const MONTH_NAMES = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

/**
 * Formats a partial ISO 8601 date string (YYYY, YYYY-MM, or YYYY-MM-DD)
 * into a human-readable format like "January 2024" or "January 15, 2024".
 */
export function formatDate(date: string, includeDay = false): string {
	const parts = date.split("-");

	if (parts.length >= 2) {
		const [year, month] = parts;
		const monthName = MONTH_NAMES[Number.parseInt(month ?? "1", 10) - 1];

		if (parts.length === 3 && includeDay) {
			return `${monthName} ${parts[2]}, ${year}`;
		}

		return `${monthName} ${year}`;
	}

	// YYYY only
	return date;
}

/**
 * Formats a date range from start and end dates.
 * Returns "Start - End", "Start - Present" if no end, or just the end date if no start.
 */
export function formatPeriod(startDate?: string, endDate?: string): string {
	if (!startDate && !endDate) return "";
	if (!startDate) return endDate || "";
	if (!endDate) return `${formatDate(startDate)} - Present`;

	return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

const MONTH_INDEX = new Map(MONTH_NAMES.map((month, index) => [month.toLowerCase(), index + 1]));

export function normalizeMonthDate(value: string): string {
	const normalized = value.trim();
	const yearFirst = /^(\d{4})[-/](\d{1,2})(?:[-/]\d{1,2})?$/.exec(normalized);
	if (yearFirst) return `${yearFirst[1]}-${yearFirst[2]?.padStart(2, "0")}`;

	const monthFirst = /^(\d{1,2})[-/](\d{4})$/.exec(normalized);
	if (monthFirst) return `${monthFirst[2]}-${monthFirst[1]?.padStart(2, "0")}`;

	const namedMonth = /^([a-z]+)\s+(\d{4})$/i.exec(normalized);
	if (!namedMonth) return "";
	const month = MONTH_INDEX.get(namedMonth[1]?.toLowerCase() ?? "");
	return month ? `${namedMonth[2]}-${String(month).padStart(2, "0")}` : "";
}

/** Best-effort migration for legacy, human-readable experience periods. */
export function parsePeriod(period?: string): { startDate: string; endDate: string } {
	if (!period) return { startDate: "", endDate: "" };
	const parts = period.split(/\s+(?:-|\u2013|\u2014|to)\s+/i);
	if (parts.length < 2) return { startDate: normalizeMonthDate(period), endDate: "" };
	const [start, end] = parts;
	return {
		startDate: normalizeMonthDate(start ?? ""),
		endDate: /^(present|current|now)$/i.test(end?.trim() ?? "") ? "" : normalizeMonthDate(end ?? ""),
	};
}

export type DateRangeValue = {
	startDate?: string | undefined;
	endDate?: string | undefined;
	period?: string | undefined;
};

/** Hydrates structured month values from either current fields or a legacy period. */
export function hydrateDateRange<T extends DateRangeValue>(value: T): T & { startDate: string; endDate: string } {
	const legacy = parsePeriod(value.period);
	return {
		...value,
		startDate: normalizeMonthDate(value.startDate ?? "") || legacy.startDate,
		endDate: normalizeMonthDate(value.endDate ?? "") || legacy.endDate,
	};
}

/**
 * Removes the legacy period once structured dates are available or edited.
 * Unparseable legacy text is retained when untouched to avoid silent data loss.
 */
export function prepareDateRangeForSave<T extends DateRangeValue>(value: T, initial?: DateRangeValue): T {
	const datesChanged = value.startDate !== initial?.startDate || value.endDate !== initial?.endDate;
	const preserveLegacy = !datesChanged && !value.startDate && !value.endDate;
	return { ...value, period: preserveLegacy ? initial?.period || undefined : undefined };
}

/** Formats current dates, falling back to an un-migrated legacy period. */
export function formatDateRange(value: DateRangeValue): string {
	return value.period || formatPeriod(value.startDate, value.endDate);
}

/**
 * Formats a single date with day included (e.g., "January 15, 2024").
 * Falls back to month-year or year-only for partial dates.
 */
export function formatSingleDate(date?: string): string {
	if (!date) return "";
	return formatDate(date, true);
}
