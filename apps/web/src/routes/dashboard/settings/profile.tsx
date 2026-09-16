import { createFileRoute } from "@tanstack/react-router";
import { ProfileSettingsPage } from "@/features/settings/pages/profile";

export const Route = createFileRoute("/dashboard/settings/profile")({
	component: RouteComponent,
});

function RouteComponent() {
	const { session } = Route.useRouteContext();

	return <ProfileSettingsPage session={session} />;
}
