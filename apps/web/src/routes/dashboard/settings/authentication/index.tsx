import { createFileRoute } from "@tanstack/react-router";
import { AuthenticationSettingsPage } from "@/features/settings/authentication";

export const Route = createFileRoute("/dashboard/settings/authentication/")({
	component: RouteComponent,
});

function RouteComponent() {
	return <AuthenticationSettingsPage />;
}
