import { createRatelimitMiddleware } from "@orpc/experimental-ratelimit";
import { MemoryRatelimiter } from "@orpc/experimental-ratelimit/memory";
import { rateLimitConfig, TRUSTED_IP_HEADERS } from "@headcv/utils/rate-limit";

const isRateLimitEnabled = process.env.NODE_ENV === "production";

type ContextWithHeaders = {
	reqHeaders?: Headers;
	user?: { id: string } | null;
};

function getTrustedIp(headers?: Headers): string | null {
	if (!headers) return null;

	for (const headerName of TRUSTED_IP_HEADERS) {
		const raw = headers.get(headerName)?.trim();
		if (!raw) continue;

		// Some proxies provide a comma-delimited chain; first item is the original client.
		const ip = raw.split(",")[0]?.trim();
		if (!ip) continue;

		return ip;
	}

	return null;
}

function getClientKey(headers?: Headers): string {
	const trustedIp = getTrustedIp(headers);
	if (trustedIp) return `ip:${trustedIp}`;

	const userAgent = headers?.get("user-agent")?.trim() ?? "unknown";
	const language = headers?.get("accept-language")?.split(",")[0]?.trim() ?? "none";

	return `fp:${userAgent.slice(0, 64)}:${language.slice(0, 16)}`;
}

function getUserKey(context: ContextWithHeaders): string {
	return context.user?.id ?? "anon";
}

function getInputKeyPart(input: unknown): string {
	if (!input || typeof input !== "object") return "no-input";

	const inputRecord = input as Record<string, unknown>;

	const fields = ["resumeId", "threadId", "conversationId", "messageId", "fileId", "id"] as const;
	for (const field of fields) {
		const value = inputRecord[field];
		if (typeof value !== "string") continue;

		const trimmedValue = value.trim();
		if (trimmedValue) return `${field}:${trimmedValue}`;
	}

	const username = inputRecord.username;
	const slug = inputRecord.slug;

	if (typeof username === "string" && typeof slug === "string") return `${username}:${slug}`;

	return "no-id";
}

const resumePasswordLimiter = new MemoryRatelimiter(rateLimitConfig.orpc.resumePassword);
const pdfLimiter = new MemoryRatelimiter(rateLimitConfig.orpc.pdfExport);
const aiLimiter = new MemoryRatelimiter(rateLimitConfig.orpc.aiRequest);
const aiPaidLimiter = new MemoryRatelimiter(rateLimitConfig.orpcPaid.aiRequest);
const storageUploadLimiter = new MemoryRatelimiter(rateLimitConfig.orpc.storageUpload);
const storageUploadPaidLimiter = new MemoryRatelimiter(rateLimitConfig.orpcPaid.storageUpload);
const storageDeleteLimiter = new MemoryRatelimiter(rateLimitConfig.orpc.storageDelete);
const resumeMutationLimiter = new MemoryRatelimiter(rateLimitConfig.orpc.resumeMutations);
const resumeMutationPaidLimiter = new MemoryRatelimiter(rateLimitConfig.orpcPaid.resumeMutations);
const disabledLimiter = {
	limit: async () => ({
		success: true,
		remaining: Number.POSITIVE_INFINITY,
		reset: Date.now(),
	}),
};

const productionLimiter = (limiter: MemoryRatelimiter) => (isRateLimitEnabled ? limiter : disabledLimiter);

/**
 * Selects the right limiter based on whether the user has a paid plan.
 * Plan info is looked up lazily at request time via the billing service.
 * Both tiers enforce rate limits — "unlimited" entitlements don't mean unlimited requests/sec.
 */
async function selectLimiter(
	context: ContextWithHeaders,
	freeLimiter: MemoryRatelimiter,
	paidLimiterInstance: MemoryRatelimiter,
) {
	if (!context.user?.id) return productionLimiter(freeLimiter);
	try {
		// Lazy import to avoid circular dependency & eager env/db initialization
		const { billingService, getEffectiveAccess } = await import("../../features/billing/service.js");
		const sub = await billingService.getSubscription(context.user.id);
		const access = getEffectiveAccess(sub);
		return productionLimiter(access === "paid" ? paidLimiterInstance : freeLimiter);
	} catch {
		return productionLimiter(freeLimiter);
	}
}

export const resumePasswordRateLimit = createRatelimitMiddleware<
	ContextWithHeaders,
	{ username: string; slug: string }
>({
	limiter: productionLimiter(resumePasswordLimiter),
	key: ({ context }, input) => `resume-password:${input.username}:${input.slug}:${getClientKey(context.reqHeaders)}`,
});

export const pdfExportRateLimit = createRatelimitMiddleware<ContextWithHeaders, { id: string }>({
	limiter: productionLimiter(pdfLimiter),
	key: ({ context }, input) => `pdf-export:${getUserKey(context)}:${input.id}`,
});

export const aiRequestRateLimit = createRatelimitMiddleware<ContextWithHeaders, unknown>({
	limiter: ({ context }) => selectLimiter(context, aiLimiter, aiPaidLimiter),
	key: ({ context }, input) => `ai-request:${getUserKey(context)}:${getInputKeyPart(input)}`,
});

export const storageUploadRateLimit = createRatelimitMiddleware<ContextWithHeaders, unknown>({
	limiter: ({ context }) => selectLimiter(context, storageUploadLimiter, storageUploadPaidLimiter),
	key: ({ context }) => `storage-upload:${getUserKey(context)}`,
});

export const storageDeleteRateLimit = createRatelimitMiddleware<ContextWithHeaders, { filename: string }>({
	limiter: productionLimiter(storageDeleteLimiter),
	key: ({ context }, input) => `storage-delete:${getUserKey(context)}:${input.filename}`,
});

export const resumeMutationRateLimit = createRatelimitMiddleware<ContextWithHeaders, unknown>({
	limiter: ({ context }) => selectLimiter(context, resumeMutationLimiter, resumeMutationPaidLimiter),
	key: ({ context }, input) => `resume-mutation:${getUserKey(context)}:${getInputKeyPart(input)}`,
});
