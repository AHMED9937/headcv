import { createFileRoute, redirect } from "@tanstack/react-router";
import z from "zod";
import { RegisterPage } from "@/features/auth/pages/register";

const planSchema = z.enum(["monthly", "yearly", "trial"]).optional().catch(undefined);

export const Route = createFileRoute("/auth/register")({
	component: RouteComponent,
	validateSearch: (search: Record<string, unknown>) => ({
		plan: planSchema.parse(search.plan),
	}),
	beforeLoad: async ({ context }) => {
		if (context.session) throw redirect({ to: "/dashboard", replace: true });
		if (context.flags.disableSignups) throw redirect({ to: "/auth/login", replace: true });
		return { session: null };
	},
});

function RouteComponent() {
	const { flags } = Route.useRouteContext();
	const { plan } = Route.useSearch();

	return (
		<RegisterPage
			disableEmailAuth={flags.disableEmailAuth}
			signupEmailDomains={flags.signupEmailDomains}
			pendingPlan={plan}
		/>
	);
}
