// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

const openInlineDialog = vi.fn();
const summary = { title: "Summary", columns: 1, hidden: false, content: "<p>Twenty years of experience.</p>" };

vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => ({ data: { summary } }),
}));
vi.mock("@/dialogs/store", () => ({
	useDialogStore: () => ({ openInlineDialog }),
}));
vi.mock("../shared/section-base", () => ({
	SectionBase: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("../shared/section-item", () => ({
	SectionItem: ({ title }: { title: string }) => <div data-testid="summary-entry">{title}</div>,
	SectionAddItemButton: ({ children, onAdd }: { children: React.ReactNode; onAdd: () => void }) => (
		<button type="button" onClick={onAdd}>
			{children}
		</button>
	),
}));

const { SummarySectionBuilder } = await import("./summary");

beforeAll(() => i18n.loadAndActivate({ locale: "en", messages: {} }));
beforeEach(() => {
	vi.clearAllMocks();
	summary.content = "<p>Twenty years of experience.</p>";
});

function renderSummary() {
	return render(
		<I18nProvider i18n={i18n}>
			<SummarySectionBuilder />
		</I18nProvider>,
	);
}

describe("SummarySectionBuilder", () => {
	it("renders persisted summary content as an entry row", () => {
		renderSummary();
		expect(screen.getByTestId("summary-entry")).toHaveTextContent("Twenty years of experience.");
	});

	it("opens the existing summary in the shared inline editor", async () => {
		renderSummary();
		await userEvent.click(screen.getByRole("button", { name: "Add a summary" }));
		expect(openInlineDialog).toHaveBeenCalledWith(
			"resume.sections.summary.update",
			expect.objectContaining({ item: expect.objectContaining({ content: summary.content }) }),
		);
	});

	it("opens create mode when the summary is empty", async () => {
		summary.content = "";
		renderSummary();
		expect(screen.queryByTestId("summary-entry")).not.toBeInTheDocument();
		await userEvent.click(screen.getByRole("button", { name: "Add a summary" }));
		expect(openInlineDialog).toHaveBeenCalledWith("resume.sections.summary.create", undefined);
	});
});
