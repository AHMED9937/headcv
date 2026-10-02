import { t } from "@lingui/core/macro";
import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@headcv/ui/components/avatar";
import { BrandIcon } from "@headcv/ui/components/brand-icon";
import { getInitials } from "@headcv/utils/string";
import { PlanBadge } from "@/features/billing/plan-badge";
import { UserDropdownMenu } from "@/features/user/dropdown-menu";
import { client } from "@/libs/orpc/client";
import { createNoindexFollowMeta } from "@/libs/seo";

/** Session-storage key matching the one set during register/OAuth. */
const PENDING_PLAN_KEY = "headcv_pending_plan";
const validPlans = new Set(["monthly", "yearly", "trial"]);

export const Route = createFileRoute("/dashboard")({
	component: RouteComponent,
	beforeLoad: async ({ context }) => {
		if (!context.session) throw redirect({ to: "/auth/login", replace: true });
		return { session: context.session };
	},
	head: () => ({
		meta: [createNoindexFollowMeta()],
	}),
});

/**
 * Detects a pending checkout plan from query params or sessionStorage,
 * then auto-starts the Dodo checkout flow.
 *
 * Sources (in priority order):
 * 1. `?checkoutPlan=monthly` query param (OAuth callbackURL, register "Continue" link)
 * 2. `headcv_pending_plan` sessionStorage (backup for email-verification redirect)
 */
function useAutoCheckout() {
	const started = useRef(false);

	useEffect(() => {
		if (started.current) return;

		const params = new URLSearchParams(window.location.search);
		let plan = params.get("checkoutPlan");

		// Fallback to sessionStorage (set during register or social auth)
		if (!plan) {
			plan = sessionStorage.getItem(PENDING_PLAN_KEY);
		}

		// Clean up immediately — both sources are one-shot
		sessionStorage.removeItem(PENDING_PLAN_KEY);
		if (params.has("checkoutPlan")) {
			params.delete("checkoutPlan");
			const clean = params.toString();
			const newUrl = `${window.location.pathname}${clean ? `?${clean}` : ""}`;
			window.history.replaceState(null, "", newUrl);
		}

		if (!plan || !validPlans.has(plan)) return;
		started.current = true;

		const startCheckout = async () => {
			try {
				const result = await client.billing.createCheckoutSession({
					plan: plan as "monthly" | "yearly" | "trial",
				});
				window.location.href = result.checkoutUrl;
			} catch {
				toast.error("Could not start checkout. You can try again from your billing settings.");
			}
		};

		void startCheckout();
	}, []);
}

function RouteComponent() {
	useAutoCheckout();

	return (
		<div className="flex min-h-svh flex-col bg-muted/30">
			<header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur">
				{/* Signed-in users are sent home to their resumes, not the marketing page. */}
				<Link to="/dashboard/resumes" aria-label={t`Go to your resumes`} className="flex items-center">
					<BrandIcon className="h-10 w-auto" />
				</Link>

				<div className="flex items-center gap-3">
					<PlanBadge />
					<UserDropdownMenu>
						{({ session }) => (
							<button
								type="button"
								className="flex items-center gap-2 rounded-md p-1 transition-colors hover:bg-accent"
							>
								<Avatar className="size-7">
									<AvatarImage src={session.user.image ?? undefined} />
									<AvatarFallback>{getInitials(session.user.name)}</AvatarFallback>
								</Avatar>

								<div className="hidden text-start md:block">
									<p className="font-medium text-sm leading-none">{session.user.name}</p>
									<p className="text-muted-foreground text-xs">{session.user.email}</p>
								</div>
							</button>
						)}
					</UserDropdownMenu>
				</div>
			</header>

			<main className="@container flex-1 p-4 sm:p-6">
				<Outlet />
			</main>
		</div>
	);
}
