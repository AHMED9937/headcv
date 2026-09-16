import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { GearSixIcon, ShieldCheckIcon, UserCircleIcon, WarningIcon } from "@phosphor-icons/react";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { cn } from "@headcv/utils/style";
import { DashboardHeader } from "../-components/header";

type SettingsTab = {
	to: string;
	icon: React.ComponentType<{ className?: string }>;
	label: string;
};

const tabs: SettingsTab[] = [
	{
		to: "/dashboard/settings/profile",
		icon: UserCircleIcon,
		label: t`Profile`,
	},
	{
		to: "/dashboard/settings/authentication",
		icon: ShieldCheckIcon,
		label: t`Authentication`,
	},
	{
		to: "/dashboard/settings/danger-zone",
		icon: WarningIcon,
		label: t`Danger Zone`,
	},
];

export const Route = createFileRoute("/dashboard/settings")({
	component: RouteComponent,
});

function RouteComponent() {
	const { i18n } = useLingui();

	return (
		<div className="space-y-4">
			<DashboardHeader icon={GearSixIcon} title={t`Settings`} />

			<nav className="flex flex-wrap gap-2 border-b pb-2">
				{tabs.map((tab) => (
					<Link
						key={tab.to}
						to={tab.to}
						className={cn(
							"flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
							"hover:bg-secondary hover:text-secondary-foreground",
							"data-[status=active]:bg-primary data-[status=active]:text-primary-foreground",
						)}
					>
						<tab.icon className="size-4" />
						{i18n.t(tab.label)}
					</Link>
				))}
			</nav>

			<Outlet />
		</div>
	);
}
