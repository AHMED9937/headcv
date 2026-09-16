import z from "zod";
import { protectedProcedure } from "../../context";
import { isAgentEnvironmentUnavailable, throwUnavailable } from "./routing";
import { agentService } from "./service";

export const actionsRouter = {
	latestByResume: protectedProcedure
		.route({
			method: "GET",
			path: "/agent/actions/latest-by-resume",
			tags: ["Agent"],
			operationId: "getLatestAgentActionByResume",
			summary: "Get the latest applied resume patch action for a resume",
		})
		.input(z.object({ resumeId: z.string() }))
		.handler(async ({ context, input }) => {
			try {
				return await agentService.actions.latestByResume({ resumeId: input.resumeId, userId: context.user.id });
			} catch (error) {
				if (isAgentEnvironmentUnavailable(error)) throwUnavailable();
				throw error;
			}
		}),

	keep: protectedProcedure
		.route({
			method: "POST",
			path: "/agent/actions/{id}/keep",
			tags: ["Agent"],
			operationId: "keepAgentAction",
			summary: "Keep an applied agent action",
		})
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			try {
				return await agentService.actions.keep({ id: input.id, userId: context.user.id });
			} catch (error) {
				if (isAgentEnvironmentUnavailable(error)) throwUnavailable();
				throw error;
			}
		}),

	revert: protectedProcedure
		.route({
			method: "POST",
			path: "/agent/actions/{id}/revert",
			tags: ["Agent"],
			operationId: "revertAgentAction",
			summary: "Restore agent action snapshot",
		})
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			try {
				return await agentService.actions.revert({ id: input.id, userId: context.user.id });
			} catch (error) {
				if (isAgentEnvironmentUnavailable(error)) throwUnavailable();
				throw error;
			}
		}),
};
