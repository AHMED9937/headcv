import { t } from "@lingui/core/macro";
import { ORPCError } from "@orpc/client";

export function getReadableErrorMessage(error: unknown, fallback: string): string {
	if (typeof error === "string" && error) return error;
	if (error instanceof Error && error.message) return error.message;
	return fallback;
}

type ErrorMessageByCode = Record<string, string>;

export function getOrpcErrorMessage(
	error: unknown,
	options: {
		fallback: string;
		byCode?: ErrorMessageByCode;
		allowServerMessage?: boolean;
	},
): string {
	if (!(error instanceof ORPCError)) return getReadableErrorMessage(error, options.fallback);

	const mappedMessage = options.byCode?.[error.code];
	if (mappedMessage) return mappedMessage;

	if (options.allowServerMessage && error.message) return error.message;
	return options.fallback;
}

export function getAgentErrorMessage(error: unknown, fallback: string, byCode?: ErrorMessageByCode): string {
	return getOrpcErrorMessage(error, {
		byCode: {
			RESUME_VERSION_CONFLICT: t`This patch no longer matches the current resume version.`,
			CONFLICT: t`This thread is archived or already has an active run.`,
			BAD_REQUEST: t`The request could not be processed. Please try again.`,
			NOT_FOUND: t`The requested item was not found.`,
			SERVICE_UNAVAILABLE: t`The AI service is unavailable right now. Please try again.`,
			...byCode,
		},
		fallback,
	});
}

export function getResumeErrorMessage(error: unknown): string {
	return getOrpcErrorMessage(error, {
		byCode: {
			RESUME_SLUG_ALREADY_EXISTS: t`A resume with this slug already exists.`,
			RESUME_LOCKED: t`This resume is locked. Unlock it first to make changes.`,
		},
		fallback: t`Something went wrong. Please try again.`,
	});
}
