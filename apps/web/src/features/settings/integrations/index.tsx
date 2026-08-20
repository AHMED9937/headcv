import { Trans } from "@lingui/react/macro";
import { m } from "motion/react";
import { useIsClient } from "usehooks-ts";

export function IntegrationsSettingsPage() {
	const isClient = useIsClient();

	if (!isClient) return null;

	return (
		<m.div
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25, ease: "easeOut" }}
			className="grid max-w-4xl gap-8 will-change-[transform,opacity]"
		>
			<p className="text-muted-foreground text-sm">
				<Trans>No integrations are available yet.</Trans>
			</p>
		</m.div>
	);
}
