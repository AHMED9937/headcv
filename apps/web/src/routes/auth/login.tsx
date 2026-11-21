import { createFileRoute, redirect } from "@tanstack/react-router";
import z from "zod";
import { LoginPage } from "@/features/auth/pages/login";
import { CHECKOUT_PLANS } from "@/features/billing/checkout-plan";

const planSchema = z.enum(CHECKOUT_PLANS).optional().catch(undefined);

export const Route = createFileRoute("/auth/login")({
	component: RouteComponent,
	validateSearch: (search: Record<string, unknown>) => ({
		plan: planSchema.parse(search.plan),
	}),
	beforeLoad: async ({ context }) => {
		if (context.session) throw redirect({ to: "/dashboard", replace: true });
		return { session: null };
	},
});

function RouteComponent() {
	const { flags } = Route.useRouteContext();
	const { plan } = Route.useSearch();

	return (
		<LoginPage disableEmailAuth={flags.disableEmailAuth} disableSignups={flags.disableSignups} pendingPlan={plan} />
	);
}
