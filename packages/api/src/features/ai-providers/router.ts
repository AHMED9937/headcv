import type { AiProviderResponse } from "./service";
import { type } from "@orpc/server";
import { protectedProcedure } from "../../context";
import { aiProvidersService } from "./service";

export const aiProvidersRouter = {
	list: protectedProcedure
		.route({
			method: "GET",
			path: "/ai-providers",
			tags: ["AI Providers"],
			operationId: "listAiProviders",
			summary: "List the globally configured AI provider",
			description: "Returns the single AI provider configured via environment variables. API keys are never included.",
		})
		.output(type<AiProviderResponse[]>())
		.handler(async ({ context }) => {
			return await aiProvidersService.list({ userId: context.user.id });
		}),
};
