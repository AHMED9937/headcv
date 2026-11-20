import type router from "@headcv/api/routers";
import type { InferRouterInputs, InferRouterOutputs, RouterClient } from "@orpc/server";
import { createORPCClient, ORPCError, onError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { BatchLinkPlugin } from "@orpc/client/plugins";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { useDialogStore } from "@/dialogs/store";

/** Quota errors open the upgrade dialog at the moment of need instead of a dead-end error. */
export const openUpgradeOnLimit = (error: unknown) => {
	if (typeof window === "undefined" || !(error instanceof ORPCError) || error.code !== "UPGRADE_REQUIRED") return;
	// Prefer the structured reason the server sends; fall back to the message for older throwers.
	const dataReason = (error.data as { reason?: string } | undefined)?.reason;
	const reason =
		dataReason === "delete-pro" ? "delete-pro" : /resume limit/i.test(error.message) ? "resume-limit" : "ai-limit";
	useDialogStore.getState().openDialog("billing.upgrade", { reason });
};

const getRpcUrl = () => {
	if (typeof window === "undefined") return "http://localhost:3000/api/rpc";
	return `${window.location.origin}/api/rpc`;
};

const createRpcClient = (): RouterClient<typeof router> => {
	const link = new RPCLink({
		url: getRpcUrl(),
		fetch: (request, init) => fetch(request, { ...init, credentials: "include" }),
		plugins: [
			new BatchLinkPlugin({
				mode: "streaming",
				groups: [{ condition: () => true, context: {} }],
			}),
		],
		interceptors: [
			onError((error) => {
				if (error instanceof DOMException && error.name === "AbortError") return;
				openUpgradeOnLimit(error);
				console.warn("[oRPC client]", error);
			}),
		],
	});

	return createORPCClient(link);
};

export const client = createRpcClient();

const createStreamClient = (): RouterClient<typeof router> => {
	const link = new RPCLink({
		url: getRpcUrl(),
		fetch: (request, init) => fetch(request, { ...init, credentials: "include" }),
		interceptors: [
			onError((error) => {
				if (error instanceof DOMException && error.name === "AbortError") return;
				openUpgradeOnLimit(error);
				console.warn("[oRPC stream client]", error);
			}),
		],
	});

	return createORPCClient(link);
};

export const streamClient = createStreamClient();

export const orpc = createTanstackQueryUtils(client);

export type RouterInput = InferRouterInputs<typeof router>;

export type RouterOutput = InferRouterOutputs<typeof router>;
