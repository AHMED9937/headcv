/**
 * Country → currency mapping for Dodo adaptive-currency pricing.
 *
 * Only currencies Dodo accepts as a checkout `billing_currency` belong here.
 * Each entry was verified with Dodo's checkout preview (scripts/verify-adaptive-currency.mjs);
 * unsupported currencies return HTTP 400 and must NOT be listed — the visitor gets USD instead.
 *
 * Known-unsupported (do not re-add): KWD, BHD, OMR, JOD, TND, DZD, LBP, IQD, ARS, COP, KES, GHS.
 * Dodo supports those *countries* for checkout, but cannot bill in their local currency, so
 * those visitors see USD and are charged in USD.
 */

/** ISO-3166 alpha-2 country code → ISO-4217 currency code (Dodo adaptive-currency supported). */
export const COUNTRY_CURRENCY: Record<string, string> = {
	// Middle East / North Africa
	EG: "EGP",
	SA: "SAR",
	AE: "AED",
	QA: "QAR",
	TR: "TRY",
	MA: "MAD",

	// Europe
	GB: "GBP",
	CH: "CHF",
	SE: "SEK",
	NO: "NOK",
	DK: "DKK",
	PL: "PLN",
	CZ: "CZK",

	// Eurozone
	DE: "EUR",
	FR: "EUR",
	ES: "EUR",
	IT: "EUR",
	NL: "EUR",
	BE: "EUR",
	AT: "EUR",
	PT: "EUR",
	IE: "EUR",
	FI: "EUR",
	GR: "EUR",

	// Asia / Oceania
	JP: "JPY",
	IN: "INR",
	AU: "AUD",
	NZ: "NZD",
	SG: "SGD",
	HK: "HKD",
	KR: "KRW",
	TH: "THB",
	MY: "MYR",
	ID: "IDR",
	PH: "PHP",
	VN: "VND",
	CN: "CNY",
	TW: "TWD",

	// Americas
	CA: "CAD",
	MX: "MXN",
	BR: "BRL",
	CL: "CLP",

	// Africa
	ZA: "ZAR",
	NG: "NGN",
};

/** All currencies we are willing to show in the pricing UI. */
export const SUPPORTED_LOCAL_CURRENCIES = new Set(Object.values(COUNTRY_CURRENCY));

/** Get the expected billing currency for a country, or undefined if unsupported. */
export function getCurrencyForCountry(country: string): string | undefined {
	return COUNTRY_CURRENCY[country.toUpperCase()];
}
