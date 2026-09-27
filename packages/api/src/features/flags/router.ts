import type { FeatureFlags } from "./service";
import z from "zod";
import { publicProcedure } from "../../context";
import { flagsService } from "./service";

export const flagsRouter = {
	get: publicProcedure
		.route({
			method: "GET",
			path: "/flags",
			tags: ["Feature Flags"],
			operationId: "getFeatureFlags",
			summary: "Get feature flags",
			description:
				"Returns the current feature flags for this HeadCV instance. Feature flags control instance-wide settings such as whether new user signups or email-based authentication are disabled, and which email domains may sign up. No authentication required.",
			successDescription: "The current feature flags for this instance.",
		})
		.output(
			z.object({
				disableSignups: z.boolean().describe("Whether new user signups are disabled on this instance."),
				disableEmailAuth: z.boolean().describe("Whether email-based authentication is disabled on this instance."),
				signupEmailDomains: z
					.array(z.string())
					.describe('Email domains accepted for email/password sign-up. ["*"] means any domain is accepted.'),
			}),
		)
		.handler((): FeatureFlags => flagsService.getFlags()),
};
