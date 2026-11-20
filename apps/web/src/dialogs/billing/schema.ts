import z from "zod";

const upgradeReasonSchema = z.enum(["badge", "ai-limit", "resume-limit", "delete-pro"]);

export const billingDialogSchemas = [
	z.object({ type: z.literal("billing.upgrade"), data: z.object({ reason: upgradeReasonSchema }) }),
] as const;
