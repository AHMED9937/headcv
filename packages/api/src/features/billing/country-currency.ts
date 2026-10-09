/**
 * Country → currency mapping for Dodo adaptive-currency pricing.
 *
 * These are the currencies we explicitly ask Dodo to price in for a given
 * visitor country. Dodo may still fall back to USD (or return a fake
 * conversion) for any unsupported pair; the provider validates the preview
 * response and keeps the UI on USD when that happens.
 *
 * Keep this list conservative and expand it only after testing the target
 * country/currency with Dodo's checkout preview endpoint.
 */

/** ISO-3166 alpha-2 country code → ISO-4217 currency code. */
export const COUNTRY_CURRENCY: Record<string, string> = {
	// Middle East / North Africa
	EG: "EGP",
	SA: "SAR",
	AE: "AED",
	QA: "QAR",
	KW: "KWD",
	BH: "BHD",
	OM: "OMR",
	JO: "JOD",
	TR: "TRY",
	MA: "MAD",
	TN: "TND",

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
	AR: "ARS",
	CL: "CLP",
	CO: "COP",

	// Africa
	ZA: "ZAR",
	NG: "NGN",
	KE: "KES",
	GH: "GHS",
};

/** All currencies we are willing to show in the pricing UI. */
export const SUPPORTED_LOCAL_CURRENCIES = new Set(Object.values(COUNTRY_CURRENCY));

/** Get the expected billing currency for a country, or undefined if unsupported. */
export function getCurrencyForCountry(country: string): string | undefined {
	return COUNTRY_CURRENCY[country.toUpperCase()];
}
