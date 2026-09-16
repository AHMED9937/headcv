// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const close = vi.fn();
const selectThread = vi.fn();
const backToThreads = vi.fn();
const focusChanges = vi.fn();

vi.mock("./ai-assistant", () => ({
	useAiAssistant: () => ({
		open: true,
		view: "threads",
		threadId: null,
		resumeId: "resume-1",
		hasReviewableChanges: true,
		action: { id: "action-1" },
		visibleChangedPreviewSectionIds: ["summary"],
		close,
		selectThread,
		backToThreads,
		focusChanges,
		draft: undefined,
		refreshAction: vi.fn(),
	}),
}));

vi.mock("@/routes/agent/-components/thread-sidebar", () => ({
	AgentThreadList: () => <div data-testid="thread-list">Threads</div>,
}));

vi.mock("@/routes/agent/-components/thread-workspace", () => ({
	AgentChat: () => <div data-testid="chat">Chat</div>,
}));

const { AiAssistantPanel } = await import("./ai-assistant-panel");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

const createTestQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderPanel = () =>
	render(
		<QueryClientProvider client={createTestQueryClient()}>
			<I18nProvider i18n={i18n}>
				<AiAssistantPanel />
			</I18nProvider>
		</QueryClientProvider>,
	);

describe("AiAssistantPanel", () => {
	it("renders the thread list when open", () => {
		renderPanel();

		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByTestId("thread-list")).toBeInTheDocument();
		expect(screen.queryByTestId("chat")).not.toBeInTheDocument();
	});

	it("calls close when the close button is clicked", async () => {
		renderPanel();

		const closeButton = screen.getByRole("button", { name: /Close AI assistant/i });
		await userEvent.click(closeButton);

		expect(close).toHaveBeenCalledOnce();
	});

	it("keeps responsive fixed positioning classes", () => {
		renderPanel();

		const panel = screen.getByRole("dialog");
		expect(panel).toHaveClass("fixed", "right-3", "bottom-20", "sm:right-6");
	});

	it("calls focusChanges when the View changes button is clicked", async () => {
		renderPanel();

		const viewChangesButton = screen.getByRole("button", { name: /View changes/i });
		await userEvent.click(viewChangesButton);

		expect(focusChanges).toHaveBeenCalledOnce();
	});
});
