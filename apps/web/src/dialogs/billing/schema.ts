import z from "zod";

export const upgradeReasonSchema = z.enum(["badge", "ai-limit", "resume-limit"]);

export type UpgradeReason = z.infer<typeof upgradeReasonSchema>;

export const billingDialogSchemas = [
	z.object({ type: z.literal("billing.upgrade"), data: z.object({ reason: upgradeReasonSchema }) }),
] as const;
