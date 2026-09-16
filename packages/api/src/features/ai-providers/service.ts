import type { AIProvider } from "@headcv/ai/types";
import { ORPCError } from "@orpc/client";
import { aiProviderSchema } from "@headcv/ai/types";
import { env } from "@headcv/env/server";
import { resolveAiBaseUrl } from "../ai/url-policy";

export type AiProviderResponse = {
	id: string;
	label: string;
	provider: AIProvider;
	model: string;
	baseURL: string | null;
	enabled: boolean;
	testStatus: string;
	testError: string | null;
	apiKeyPreview: string;
	apiKeyFingerprint: string;
	lastTestedAt: Date | null;
	lastUsedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

type EnvAiProvider = AiProviderResponse & {
	apiKey: string;
};

const ENV_PROVIDER_ID = "env";
const ENV_PROVIDER_LABEL = "Global AI Provider";
const REDACTED_PREVIEW = "••••";
const REDACTED_FINGERPRINT = "env";

function getEnvProviderConfig(): {
	provider: AIProvider;
	model: string;
	baseURL: string | null;
	apiKey: string;
} | null {
	const rawProvider = env.AI_PROVIDER?.trim();
	const model = env.AI_MODEL?.trim();
	const rawApiKey = env.AI_API_KEY?.trim();

	if (!rawProvider || !model) return null;

	const parsed = aiProviderSchema.safeParse(rawProvider);
	if (!parsed.success) return null;

	const provider = parsed.data;
	const apiKey = rawApiKey ?? "";
	const baseURL = env.AI_BASE_URL?.trim() ? resolveAiBaseUrl({ provider, baseURL: env.AI_BASE_URL.trim() }) : null;

	return { provider, model, baseURL, apiKey };
}

function buildEnvProviderResponse(): AiProviderResponse | null {
	const config = getEnvProviderConfig();
	if (!config) return null;

	const now = new Date();

	return {
		id: ENV_PROVIDER_ID,
		label: ENV_PROVIDER_LABEL,
		provider: config.provider,
		model: config.model,
		baseURL: config.baseURL,
		enabled: true,
		testStatus: "success",
		testError: null,
		apiKeyPreview: REDACTED_PREVIEW,
		apiKeyFingerprint: REDACTED_FINGERPRINT,
		lastTestedAt: now,
		lastUsedAt: null,
		createdAt: now,
		updatedAt: now,
	};
}

function getEnvProvider(): EnvAiProvider {
	const config = getEnvProviderConfig();
	if (!config) {
		throw new ORPCError("BAD_REQUEST", { message: "AI provider is not configured in the environment." });
	}

	if (config.provider !== "ollama" && !config.apiKey) {
		throw new ORPCError("BAD_REQUEST", { message: "AI API key is required for the configured provider." });
	}

	const response = buildEnvProviderResponse();
	if (!response) {
		throw new ORPCError("BAD_REQUEST", { message: "AI provider is not configured in the environment." });
	}

	return {
		...response,
		apiKey: config.apiKey,
	};
}

export const aiProvidersService = {
	list: async (_input: { userId: string }) => {
		const provider = buildEnvProviderResponse();
		return provider ? [provider] : [];
	},

	getRunnableById: async (_input: { id: string; userId: string }) => {
		return getEnvProvider();
	},

	getDefaultRunnable: async (_input: { userId: string }) => {
		return getEnvProvider();
	},

	markUsed: async (_input: { id: string; userId: string }) => {
		// No-op: the env provider does not track per-use state.
	},
};
