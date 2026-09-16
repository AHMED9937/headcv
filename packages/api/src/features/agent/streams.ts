import type { UIMessageChunk } from "ai";
import type { ResumableStreamContext } from "resumable-stream/ioredis";
import { ORPCError } from "@orpc/client";
import { JsonToSseTransformStream } from "ai";
import { Redis } from "ioredis";
import { createResumableStreamContext } from "resumable-stream/ioredis";
import { env } from "@headcv/env/server";

type AgentStreamContext = Pick<ResumableStreamContext, "createNewResumableStream" | "resumeExistingStream">;

type AgentStreamLifecycleOptions = {
	getContext: () => AgentStreamContext;
	checkConnection?: () => Promise<unknown>;
};

let streamContext: AgentStreamContext | null = null;
let publisher: Redis | null = null;

function createStreamRedisClient() {
	if (!env.REDIS_URL) throw new Error("AGENT_ENVIRONMENT_UNAVAILABLE");
	const client = new Redis(env.REDIS_URL, {
		connectTimeout: 3_000,
		commandTimeout: 5_000,
		maxRetriesPerRequest: 1,
	});
	// Report connectivity through the request error without logging credentials from Redis URLs.
	client.on("error", () => {});
	return client;
}

function getPublisher() {
	publisher ??= createStreamRedisClient();
	return publisher;
}

function streamUnavailable(cause: unknown) {
	return new ORPCError("SERVICE_UNAVAILABLE", {
		message:
			"AI chat is temporarily unavailable because its streaming service cannot connect. Please try again shortly.",
		cause,
	});
}

export function emptyAgentStream() {
	return new ReadableStream<string>({
		start(controller) {
			controller.close();
		},
	});
}

function getAgentStreamContext() {
	streamContext ??= createResumableStreamContext({
		keyPrefix: "headcv:agent-stream",
		waitUntil: null,
		publisher: getPublisher(),
		subscriber: createStreamRedisClient(),
	});

	return streamContext;
}

export function createAgentStreamLifecycle(options: AgentStreamLifecycleOptions) {
	return {
		async ensureAvailable() {
			try {
				await options.checkConnection?.();
			} catch (error) {
				throw streamUnavailable(error);
			}
		},

		async create(streamId: string, makeStream: () => ReadableStream<UIMessageChunk>) {
			try {
				const stream = await options
					.getContext()
					.createNewResumableStream(streamId, () => makeStream().pipeThrough(new JsonToSseTransformStream()));

				return stream ?? emptyAgentStream();
			} catch (error) {
				throw streamUnavailable(error);
			}
		},

		async resume(streamId: string | null | undefined) {
			if (!streamId) return emptyAgentStream();

			try {
				const stream = await options.getContext().resumeExistingStream(streamId);
				return stream ?? emptyAgentStream();
			} catch (error) {
				throw streamUnavailable(error);
			}
		},
	};
}

export const agentStreamLifecycle = createAgentStreamLifecycle({
	getContext: getAgentStreamContext,
	checkConnection: () => getPublisher().ping(),
});
