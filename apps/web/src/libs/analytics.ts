/**
 * Privacy-safe analytics wrapper.
 *
 * Rules:
 * - Only whitelisted event names may be tracked.
 * - Event payloads must only contain safe, non-PII fields.
 * - Any string value that looks like an email, phone, or CV content is redacted.
 * - If no analytics provider is configured, events are logged to console.debug in development.
 */

export type LandingEvent =
	| { name: "landing_view"; properties?: Record<string, never> }
	| { name: "landing_cta_click"; properties: { cta: "create_my_cv" } }
	| { name: "language_select"; properties: { locale: string } }
	| { name: "disclosure_view"; properties?: Record<string, never> };

export type AnalyticsEvent = LandingEvent;

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}/g;
const LONG_TEXT_THRESHOLD = 120;

function redact(value: unknown): unknown {
	if (typeof value === "string") {
		let redacted = value.replaceAll(EMAIL_REGEX, "[REDACTED_EMAIL]").replaceAll(PHONE_REGEX, "[REDACTED_PHONE]");

		if (redacted.length > LONG_TEXT_THRESHOLD) {
			redacted = `${redacted.slice(0, LONG_TEXT_THRESHOLD)}…`;
		}

		return redacted;
	}

	if (Array.isArray(value)) {
		return value.map(redact);
	}

	if (value && typeof value === "object") {
		return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, redact(val)]));
	}

	return value;
}

export function trackEvent(event: AnalyticsEvent): void {
	const safeEvent = { name: event.name, properties: redact(event.properties ?? {}) };

	const global = globalThis as unknown as { gtag?: (...args: unknown[]) => void };
	if (typeof global.gtag === "function") {
		global.gtag("event", safeEvent.name, safeEvent.properties);
		return;
	}

	if (import.meta.env.DEV) {
		console.debug("[analytics]", safeEvent);
	}
}
