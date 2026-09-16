import { createFileRoute } from "@tanstack/react-router";
import { DangerZoneSettingsPage } from "@/features/settings/pages/danger-zone";

export const Route = createFileRoute("/dashboard/settings/danger-zone")({
	component: RouteComponent,
});

function RouteComponent() {
	return <DangerZoneSettingsPage />;
}
