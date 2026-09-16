import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { ChatCircleDotsIcon, SparkleIcon, XIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@headcv/ui/components/button";
import { Spinner } from "@headcv/ui/components/spinner";
import { getOrpcErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";
import { AgentThreadList } from "@/routes/agent/-components/thread-sidebar";
import { AgentChat } from "@/routes/agent/-components/thread-workspace";
import { useAiAssistant } from "./ai-assistant";

export function AiAssistantPanel() {
	const { open, view, threadId, resumeId, hasReviewableChanges, close, focusChanges, selectThread, backToThreads } =
		useAiAssistant();

	useEffect(() => {
		if (!open) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") close();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [close, open]);

	if (!open) return null;

	return (
		<section
			role="dialog"
			aria-modal="false"
			aria-labelledby="builder-ai-assistant-title"
			className="fixed right-3 bottom-20 z-60 flex h-[min(42rem,calc(100svh-6rem))] w-[calc(100vw-1.5rem)] max-w-[32rem] flex-col overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl sm:right-6"
		>
			<header className="flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3">
				<div className="min-w-0">
					<h2 id="builder-ai-assistant-title" className="flex items-center gap-2 font-semibold text-sm">
						<SparkleIcon className="size-4 text-primary" weight="fill" />
						<Trans>AI Assistant</Trans>
					</h2>
					<p className="mt-0.5 truncate text-muted-foreground text-xs">
						{view === "threads" ? <Trans>Chats for this resume</Trans> : <Trans>Chat about this resume</Trans>}
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-1">
					{hasReviewableChanges ? (
						<Button size="xs" variant="ghost" className="text-emerald-700" onClick={focusChanges}>
							<Trans>View changes</Trans>
						</Button>
					) : null}
					<Button size="icon-sm" variant="ghost" onClick={close} aria-label={t`Close AI assistant`}>
						<XIcon />
					</Button>
				</div>
			</header>

			{view === "threads" || !threadId ? (
				<AssistantThreadList resumeId={resumeId} onSelectThread={selectThread} />
			) : (
				<AssistantConversation threadId={threadId} resumeId={resumeId} onBack={backToThreads} />
			)}
		</section>
	);
}

function AssistantThreadList({
	resumeId,
	onSelectThread,
}: {
	resumeId: string;
	onSelectThread: (threadId: string) => void;
}) {
	const queryClient = useQueryClient();
	const createThread = useMutation(orpc.agent.threads.create.mutationOptions());

	const onNewThread = () => {
		createThread.mutate(
			{ workingResumeId: resumeId },
			{
				onSuccess: async (thread) => {
					await queryClient.invalidateQueries({ queryKey: orpc.agent.threads.list.queryKey() });
					onSelectThread(thread.id);
				},
				onError: (error) => {
					toast.error(
						getOrpcErrorMessage(error, {
							byCode: {
								BAD_REQUEST: t`Add and test an AI provider before starting a chat.`,
								PRECONDITION_FAILED: t`AI agent setup is not available yet.`,
							},
							fallback: t`Failed to start AI chat.`,
						}),
					);
				},
			},
		);
	};

	return (
		<div className="flex min-h-0 flex-1 flex-col bg-muted/20">
			{createThread.isPending ? (
				<div className="flex items-center gap-2 border-b px-4 py-2 text-muted-foreground text-xs">
					<Spinner className="size-3.5" />
					<Trans>Starting chat…</Trans>
				</div>
			) : null}
			<AgentThreadList workingResumeId={resumeId} onNewThread={onNewThread} onSelectThread={onSelectThread} />
		</div>
	);
}

function AssistantConversation({
	threadId,
	resumeId,
	onBack,
}: {
	threadId: string;
	resumeId: string;
	onBack: () => void;
}) {
	const { draft, refreshAction } = useAiAssistant();
	const { data, isLoading, error } = useQuery(orpc.agent.threads.get.queryOptions({ input: { id: threadId } }));

	if (isLoading) {
		return (
			<div className="grid min-h-0 flex-1 place-items-center text-muted-foreground">
				<Spinner />
			</div>
		);
	}

	if (error || !data || data.thread.workingResumeId !== resumeId) {
		return (
			<div className="grid min-h-0 flex-1 place-items-center p-6 text-center">
				<div className="space-y-3">
					<ChatCircleDotsIcon className="mx-auto size-8 text-muted-foreground" />
					<p className="text-muted-foreground text-sm">
						<Trans>This chat could not be opened for the current resume.</Trans>
					</p>
					<Button size="sm" variant="outline" onClick={onBack}>
						<Trans>Back to chats</Trans>
					</Button>
				</div>
			</div>
		);
	}

	const readOnlyReason: "archived" | "missing" | null = data.isReadOnly
		? data.thread.status === "archived"
			? "archived"
			: "missing"
		: null;

	return (
		<div className="min-h-0 flex-1">
			<AgentChat
				threadId={threadId}
				resumeId={resumeId}
				initialMessages={data.messages}
				isReadOnly={data.isReadOnly}
				readOnlyReason={readOnlyReason}
				threadStatus={data.thread.status}
				activeRunId={data.thread.activeRunId}
				actions={data.actions}
				draftMessage={draft}
				onBack={onBack}
				onDeleted={onBack}
				onActionApplied={refreshAction}
			/>
		</div>
	);
}
