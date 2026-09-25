import { defineDialogRenderer, defineDialogRendererRegistry } from "../renderer-registry";
import { UpgradeDialog } from "./upgrade";

export const billingDialogRendererRegistry = defineDialogRendererRegistry("billing", [
	defineDialogRenderer("billing.upgrade", (dialog) => <UpgradeDialog data={dialog.data} />),
]);
