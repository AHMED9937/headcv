/** Currency helpers shared by the billing endpoints. */

/** Decimal places a currency uses (2 for USD, 0 for JPY, …), via Intl with a safe default. */
export function currencyFractionDigits(currency: string): number {
	try {
		return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
	} catch {
		return 2;
	}
}

/** Converts a minor-unit amount (cents, paise, …) to major units using the currency's scale. */
export function minorToMajor(minor: number, currency: string): number {
	return minor / 10 ** currencyFractionDigits(currency);
}
