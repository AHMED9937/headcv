import type { PlanSlug } from "./service";
import { ORPCError } from "@orpc/client";
import { z } from "zod";
import { env } from "@headcv/env/server";
import { protectedProcedure, publicProcedure } from "../../context";
import { getPaymentProvider } from "./provider.js";
import { billingService, entitlementService, getEffectiveAccess, getPlanLimits, hasUsedTrial } from "./service";

export const billingRouter = {
	/** Public: returns available pricing plans and their limits. */
	getPlans: publicProcedure
		.route({
			method: "GET",
			path: "/billing/plans",
			tags: ["Billing"],
			operationId: "getBillingPlans",
			summary: "Get available billing plans",
		})
		.handler(async () => {
			return {
				plans: [
					{
						slug: "free",
						name: "Free",
						price: 0,
						interval: null,
						limits: getPlanLimits("free"),
					},
					{
						slug: "trial",
						name: "Pro 7-Day Trial",
						price: 300, // $3.00 every 7 days, renewable
						interval: "week" as const,
						limits: getPlanLimits("trial"),
					},
					{
						slug: "monthly",
						name: "Pro Monthly",
						price: 2000, // $20.00 in cents
						interval: "month" as const,
						limits: getPlanLimits("monthly"),
					},
					{
						slug: "yearly",
						name: "Pro Yearly",
						price: 6000, // $60.00 in cents ($5/mo equivalent)
						interval: "year" as const,
						limits: getPlanLimits("yearly"),
					},
				],
			};
		}),

	/** Protected: get the authenticated user's current subscription + usage. */
	getSubscription: protectedProcedure
		.route({
			method: "GET",
			path: "/billing/subscription",
			tags: ["Billing"],
			operationId: "getBillingSubscription",
			summary: "Get current subscription and usage",
		})
		.handler(async ({ context }) => {
			const sub = await billingService.getSubscription(context.user.id);
			const usage = await entitlementService.getUsage(context.user.id);
			const resumes = await entitlementService.getResumeAllowance(context.user.id);
			const access = getEffectiveAccess(sub);
			const limits = access === "paid" ? getPlanLimits(sub.plan) : getPlanLimits("free");

			return {
				plan: sub.plan,
				status: sub.status,
				provider: sub.provider,
				cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
				currentPeriodStart: sub.currentPeriodStart?.toISOString() ?? null,
				currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
				effectiveAccess: access,
				trialEligible: !hasUsedTrial(sub),
				usage: {
					resumesUsed: resumes.used,
					resumesLimit: resumes.limit,
					aiChatsUsed: usage.aiChatsUsed,
					aiChatsLimit: limits.aiChats,
				},
			};
		}),

	/** Protected: create a checkout session with the payment provider. */
	createCheckoutSession: protectedProcedure
		.route({
			method: "POST",
			path: "/billing/checkout",
			tags: ["Billing"],
			operationId: "createBillingCheckout",
			summary: "Create a checkout session",
		})
		.input(
			z.object({
				plan: z.enum(["monthly", "yearly", "trial"]),
				country: z.string().length(2).optional(),
			}),
		)
		.errors({
			PAYMENT_PROVIDER_ERROR: {
				message: "Could not create checkout session.",
				status: 502,
			},
			TRIAL_ALREADY_USED: {
				message: "The 7-day trial can only be used once. Choose a monthly or yearly plan.",
				status: 409,
			},
		})
		.handler(async ({ context, input }) => {
			if (input.plan === "trial" && hasUsedTrial(await billingService.getSubscription(context.user.id))) {
				throw new ORPCError("TRIAL_ALREADY_USED", {
					message: "The 7-day trial can only be used once. Choose a monthly or yearly plan.",
				});
			}

			try {
				const provider = getPaymentProvider(input.country);
				const returnUrl = `${env.APP_URL}/checkout/success`;

				const result = await provider.createCheckoutSession({
					plan: input.plan,
					customerEmail: context.user.email,
					customerName: context.user.name,
					returnUrl,
					metadata: { userId: context.user.id },
				});

				// Persist the provider customer association so webhooks can map back
				await billingService.upsertSubscription({
					userId: context.user.id,
					provider: provider.name,
					providerCustomerId: null,
					providerSubscriptionId: "",
					plan: "free", // stays free until webhook confirms
					status: "pending",
					currentPeriodStart: null,
					currentPeriodEnd: null,
					cancelAtPeriodEnd: false,
					metadata: { sessionId: result.sessionId, pendingPlan: input.plan },
				});

				return { checkoutUrl: result.checkoutUrl };
			} catch (error) {
				console.error("[billing] Checkout session error:", error);
				if (error instanceof Error && error.message.includes("not yet implemented")) {
					throw new ORPCError("PAYMENT_PROVIDER_ERROR", {
						message: "This payment provider is not yet available.",
					});
				}
				throw new ORPCError("PAYMENT_PROVIDER_ERROR", {
					message: "Could not create checkout session.",
				});
			}
		}),

	/**
	 * Protected: verify a checkout session and activate the subscription.
	 * This is the fallback path — called from the checkout success page.
	 * The primary activation path is via webhooks.
	 */
	verifyAndActivate: protectedProcedure
		.route({
			method: "POST",
			path: "/billing/verify",
			tags: ["Billing"],
			operationId: "verifyAndActivateBilling",
			summary: "Verify checkout and activate subscription",
		})
		.handler(async ({ context }) => {
			const sub = await billingService.getSubscription(context.user.id);

			// Already active — nothing to do
			if (sub.status === "active" && sub.plan !== "free") {
				return { activated: true, plan: sub.plan, status: "active" };
			}

			// No pending checkout to verify
			const meta = sub.metadata as Record<string, unknown> | null;
			const sessionId = meta?.sessionId as string | undefined;
			const pendingPlan = meta?.pendingPlan as string | undefined;

			if (!sessionId) {
				return { activated: false, plan: sub.plan, status: sub.status };
			}

			// Verify with Dodo
			const provider = getPaymentProvider();
			const session = await provider.getCheckoutSession(sessionId);

			if (!session || session.paymentStatus !== "succeeded") {
				return { activated: false, plan: sub.plan, status: session?.paymentStatus ?? "unknown" };
			}

			// Payment succeeded — activate
			const plan = (pendingPlan ?? "monthly") as PlanSlug;

			await billingService.upsertSubscription({
				userId: context.user.id,
				provider: provider.name,
				providerCustomerId: session.customerId,
				providerSubscriptionId: session.subscriptionId ?? "",
				plan,
				status: "active",
				currentPeriodStart: new Date(),
				currentPeriodEnd: null, // will be set by webhook renewal
				cancelAtPeriodEnd: false,
				metadata: { ...meta, paymentVerified: true },
			});

			await entitlementService.resetUsage(context.user.id);

			return { activated: true, plan, status: "active" };
		}),

	/** Protected: get the customer portal URL for managing subscription. */
	getCustomerPortal: protectedProcedure
		.route({
			method: "GET",
			path: "/billing/portal",
			tags: ["Billing"],
			operationId: "getBillingPortal",
			summary: "Get customer portal URL",
		})
		.errors({
			PAYMENT_PROVIDER_ERROR: {
				message: "Could not create portal session.",
				status: 502,
			},
		})
		.handler(async ({ context }) => {
			const sub = await billingService.getSubscription(context.user.id);

			if (!sub.providerCustomerId || sub.plan === "free") {
				throw new ORPCError("BAD_REQUEST", {
					message: "No active paid subscription to manage.",
				});
			}

			try {
				const provider = getPaymentProvider(); // use default provider
				const returnUrl = `${env.APP_URL}/dashboard/settings/billing`;

				const result = await provider.getCustomerPortalUrl({
					customerId: sub.providerCustomerId,
					returnUrl,
				});

				return { portalUrl: result.portalUrl };
			} catch {
				throw new ORPCError("PAYMENT_PROVIDER_ERROR", {
					message: "Could not create portal session.",
				});
			}
		}),
};
