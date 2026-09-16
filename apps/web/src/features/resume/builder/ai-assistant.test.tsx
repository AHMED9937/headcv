// @vitest-environment happy-dom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { defaultResumeData } from "@headcv/schema/resume/default";

const mocks = vi.hoisted(() => ({
	confirm: vi.fn(),
	keep: vi.fn(),
	refresh: vi.fn(),
	navigate: vi.fn(),
	action: null as unknown,
}));
vi.mock("@/hooks/use-confirm", () => ({ useConfirm: () => mocks.confirm }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => mocks.navigate, useSearch: () => ({}) }));
vi.mock("./draft", () => ({
	useCurrentResume: () => ({ id: "resume-1", data: defaultResumeData }),
	refreshResumeFromServer: mocks.refresh,
}));
vi.mock("@/libs/orpc/client", () => ({
	orpc: {
		agent: {
			actions: {
				latestByResume: {
					queryKey: () => ["action"],
					queryOptions: () => ({ queryKey: ["action"], queryFn: async () => mocks.action }),
				},
				keep: { mutationOptions: () => ({ mutationFn: mocks.keep }) },
				revert: { mutationOptions: () => ({ mutationFn: vi.fn() }) },
			},
		},
		resume: { getById: { queryKey: () => ["resume"] } },
	},
}));

const { AiAssistantProvider, useAiAssistant } = await import("./ai-assistant");
function Controls() {
	const context = useAiAssistant();
	return (
		<>
			<p>{context.visibleChangedPreviewSectionIds.join(",")}</p>
			<p>{context.reviewData?.summary.content}</p>
			<p>{context.reviewData?.sections.experience.items[0]?.description}</p>
			<p>{context.open ? "Chat open" : "Chat closed"}</p>
			<p>{context.draft}</p>
			<button type="button" onClick={() => context.editWithAI("summary")}>
				Edit with AI
			</button>
			<button type="button" onClick={() => context.regenerateSection("summary")}>
				Regenerate
			</button>
			<button type="button" onClick={context.refreshAction}>
				Refresh
			</button>
		</>
	);
}
beforeAll(() => i18n.loadAndActivate({ locale: "en", messages: {} }));
beforeEach(() => {
	vi.clearAllMocks();
	mocks.refresh.mockResolvedValue(undefined);
	mocks.keep.mockResolvedValue({ status: "accepted" });
	mocks.action = {
		id: "action-1",
		threadId: "thread-1",
		status: "applied",
		snapshotData: structuredClone(defaultResumeData),
		operations: [{ op: "replace", path: "/summary/content", value: "Improved summary" }],
	};
});
async function renderProvider() {
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
	render(
		<QueryClientProvider client={queryClient}>
			<AiAssistantProvider resumeId="resume-1">
				<Controls />
			</AiAssistantProvider>
		</QueryClientProvider>,
	);
	await screen.findByText("Improved summary");
}
describe("AI review provider", () => {
	it("derives review content from the stored patch even while the builder still has the old data", async () => {
		await renderProvider();
		expect(screen.getByText("summary")).toBeInTheDocument();
		await userEvent.click(screen.getByText("Refresh"));
		expect(mocks.refresh).toHaveBeenCalledWith("resume-1", expect.any(QueryClient));
	});
	it("does not accept or open chat when confirmation is cancelled", async () => {
		mocks.confirm.mockResolvedValue(false);
		await renderProvider();
		await userEvent.click(screen.getByText("Edit with AI"));
		expect(mocks.keep).not.toHaveBeenCalled();
		expect(screen.getByText("Chat closed")).toBeInTheDocument();
	});
	it.each(["Edit with AI", "Regenerate"])("keeps the update before preparing %s in chat", async (button) => {
		mocks.confirm.mockResolvedValue(true);
		await renderProvider();
		await userEvent.click(screen.getByText(button));
		await screen.findByText("Chat open");
		expect(mocks.keep).toHaveBeenCalledWith({ id: "action-1" }, expect.anything());
		expect(screen.getByText(/before applying changes/)).toBeInTheDocument();
	});
	it("stays in review when Keep fails", async () => {
		mocks.confirm.mockResolvedValue(true);
		mocks.keep.mockRejectedValueOnce(new Error("failed"));
		await renderProvider();
		await userEvent.click(screen.getByText("Regenerate"));
		await waitFor(() => expect(mocks.keep).toHaveBeenCalled());
		expect(screen.getByText("Chat closed")).toBeInTheDocument();
	});

	it("detects both summary and experience changes from a stored patch", async () => {
		const snapshotData = structuredClone(defaultResumeData);
		snapshotData.summary.content = "Before summary";
		snapshotData.sections.experience.items = [
			{
				id: "exp-1",
				hidden: false,
				company: "Acme",
				position: "Engineer",
				location: "Remote",
				period: "2020-2024",
				website: { label: "", url: "" },
				description: "<p>Built things.</p>",
				roles: [],
			},
		] as never;
		mocks.action = {
			id: "action-2",
			threadId: "thread-2",
			status: "applied",
			snapshotData,
			operations: [
				{ op: "replace", path: "/summary/content", value: "After summary" },
				{ op: "replace", path: "/sections/experience/items/0/description", value: "<p>Led platform rewrite.</p>" },
			],
		};

		await render(
			<QueryClientProvider
				client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}
			>
				<AiAssistantProvider resumeId="resume-1">
					<Controls />
				</AiAssistantProvider>
			</QueryClientProvider>,
		);

		await screen.findByText("After summary");
		const ids = screen.getByText(/summary,/);
		// visibleChangedPreviewSectionIds renders as a comma-separated list.
		expect(ids.textContent).toMatch(/summary/);
		expect(ids.textContent).toMatch(/experience/);
		expect(screen.getByText("<p>Led platform rewrite.</p>")).toBeInTheDocument();
	});
});
