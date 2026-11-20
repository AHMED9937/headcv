// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from "vitest";
import { ORPCError } from "@orpc/client";
import { useDialogStore } from "@/dialogs/store";
import { openUpgradeOnLimit } from "./client";

describe("openUpgradeOnLimit", () => {
	beforeEach(() => {
		useDialogStore.setState({ open: false, activeDialog: null });
	});

	it("opens the upgrade dialog for AI chat limits", () => {
		openUpgradeOnLimit(new ORPCError("UPGRADE_REQUIRED", { message: "AI chat limit reached. Upgrade your plan." }));

		expect(useDialogStore.getState().activeDialog).toEqual({ type: "billing.upgrade", data: { reason: "ai-limit" } });
	});

	it("opens the upgrade dialog for the free resume limit", () => {
		openUpgradeOnLimit(
			new ORPCError("UPGRADE_REQUIRED", {
				message: "Free plan resume limit reached. Upgrade your plan for unlimited resumes.",
			}),
		);

		expect(useDialogStore.getState().activeDialog).toEqual({
			type: "billing.upgrade",
			data: { reason: "resume-limit" },
		});
	});

	it("opens the upgrade dialog for the Pro-only delete gate via the structured reason", () => {
		openUpgradeOnLimit(
			new ORPCError("UPGRADE_REQUIRED", {
				message: "Deleting resumes is a Pro feature. Upgrade your plan to delete resumes.",
				data: { reason: "delete-pro" },
			}),
		);

		expect(useDialogStore.getState().activeDialog).toEqual({
			type: "billing.upgrade",
			data: { reason: "delete-pro" },
		});
	});

	it("ignores unrelated errors", () => {
		openUpgradeOnLimit(new ORPCError("FORBIDDEN"));
		openUpgradeOnLimit(new Error("UPGRADE_REQUIRED"));

		expect(useDialogStore.getState().open).toBe(false);
	});
});
