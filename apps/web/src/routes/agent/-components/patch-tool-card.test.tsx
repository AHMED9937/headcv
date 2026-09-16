// @vitest-environment happy-dom

import type { UIMessage } from "ai";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { PatchToolCard } from "./patch-tool-card";

beforeAll(() => i18n.loadAndActivate({ locale: "en", messages: {} }));

function renderWithI18n(ui: ReactNode) {
	return render(<I18nProvider i18n={i18n}>{ui}</I18nProvider>);
}

const basePart = {
	type: "tool-apply_resume_patch",
	toolCallId: "call-1",
	input: { title: "Improve summary" },
} as unknown as UIMessage["parts"][number];

function partWith(state: string, extra: Record<string, unknown> = {}): UIMessage["parts"][number] {
	return { ...basePart, state, ...extra } as unknown as UIMessage["parts"][number];
}

const baseAction = {
	id: "action-1",
	title: "Improve summary",
	status: "applied",
	canRollback: true,
	operations: [{ op: "replace" as const, path: "/summary/content", value: "Better summary" }],
};

describe("PatchToolCard", () => {
	it("shows a pending state while the patch is being applied", () => {
		renderWithI18n(<PatchToolCard part={basePart} action={baseAction} onRevert={vi.fn()} isReverting={false} />);
		expect(screen.getByText(/Applying/i)).toBeInTheDocument();
		expect(screen.getByText(/The AI is updating your resume/i)).toBeInTheDocument();
	});

	it("shows the applied state with a restore action", async () => {
		const onRevert = vi.fn();
		renderWithI18n(
			<PatchToolCard part={partWith("output-available")} action={baseAction} onRevert={onRevert} isReverting={false} />,
		);
		expect(screen.getByText(/Improve summary/i)).toBeInTheDocument();
		expect(screen.getByText("Applied")).toBeInTheDocument();
		await userEvent.click(screen.getByRole("button", { name: /Restore/i }));
		expect(onRevert).toHaveBeenCalledWith("action-1");
	});

	it("shows a detailed failure message and a try again action", async () => {
		const onRetry = vi.fn();
		renderWithI18n(
			<PatchToolCard
				part={partWith("output-error", { errorText: "The resume was modified by another session." })}
				action={baseAction}
				onRevert={vi.fn()}
				isReverting={false}
				onRetry={onRetry}
			/>,
		);
		expect(screen.getByText("Failed")).toBeInTheDocument();
		expect(screen.getByText(/The AI couldn't apply the changes/i)).toBeInTheDocument();
		expect(screen.getByText(/The resume was modified by another session/i)).toBeInTheDocument();
		await userEvent.click(screen.getByRole("button", { name: /Try again/i }));
		expect(onRetry).toHaveBeenCalledOnce();
	});

	it("shows a restored state and disables restore", () => {
		renderWithI18n(
			<PatchToolCard
				part={partWith("output-available")}
				action={{ ...baseAction, status: "rolled_back", canRollback: false }}
				onRevert={vi.fn()}
				isReverting={false}
			/>,
		);
		expect(screen.getByText("Restored")).toBeInTheDocument();
		expect(screen.getByText(/The changes were restored to the previous version/i)).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /Restore/i })).not.toBeInTheDocument();
	});

	it("shows a conflict state with the conflict message", () => {
		renderWithI18n(
			<PatchToolCard
				part={partWith("output-available")}
				action={{
					...baseAction,
					status: "conflicted",
					canRollback: false,
					revertMessage: "Resume is newer than this patch.",
				}}
				onRevert={vi.fn()}
				isReverting={false}
			/>,
		);
		expect(screen.getByText("Conflict")).toBeInTheDocument();
		expect(screen.getByText(/These changes conflict with a newer edit/i)).toBeInTheDocument();
		expect(screen.getByText(/Resume is newer than this patch/i)).toBeInTheDocument();
	});
});
