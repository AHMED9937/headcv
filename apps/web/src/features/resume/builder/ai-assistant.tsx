import type { ResumeData } from "@headcv/schema/resume/data";
import type { RouterOutput } from "@/libs/orpc/client";
import type { LeftSidebarSection } from "@/libs/resume/section";
import type { BuilderSearch } from "@/routes/builder/$resumeId/-components/workspace-search";
import { t } from "@lingui/core/macro";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { toast } from "sonner";
import { normalizeResumeData } from "@headcv/resume/normalize";
import { applyResumePatches } from "@headcv/resume/patch";
import { useConfirm } from "@/hooks/use-confirm";
import { getAgentErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";
import { getSectionTitle, leftSidebarSections } from "@/libs/resume/section";
import { getAffectedPreviewSectionIds, getAffectedSections, getSectionReviewGroups } from "./ai-changes";
import { refreshResumeFromServer, useCurrentResume } from "./draft";

export type AiAssistantView = "threads" | "chat";

type LatestAgentAction = NonNullable<RouterOutput["agent"]["actions"]["latestByResume"]>;

type AiAssistantContextValue = {
	resumeId: string;
	open: boolean;
	view: AiAssistantView;
	threadId: string | null;
	hasReviewableChanges: boolean;
	action: LatestAgentAction | undefined;
	snapshotData: ResumeData | undefined;
	reviewData: ResumeData | undefined;
	changedSections: LeftSidebarSection[];
	changedPreviewSectionIds: string[];
	visibleChangedPreviewSectionIds: string[];
	selectedReviewSectionId: string | null;
	draft: string | undefined;
	isReverting: boolean;
	isKeeping: boolean;
	isLoading: boolean;
	openThreads: () => void;
	openChat: (draft?: string, threadId?: string) => void;
	selectThread: (threadId: string) => void;
	backToThreads: () => void;
	close: () => void;
	focusChanges: () => void;
	selectReviewSection: (sectionId: string) => void;
	keep: () => void;
	regenerateSection: (sectionId: string) => void;
	editWithAI: (sectionId: string) => void;
	editManually: (sectionId: string) => void;
	revert: () => void;
	clearDraft: () => void;
	refreshAction: () => void;
};

const AiAssistantContext = createContext<AiAssistantContextValue | null>(null);

export function useAiAssistant() {
	const context = useContext(AiAssistantContext);
	if (!context) throw new Error("useAiAssistant must be used within an AiAssistantProvider");
	return context;
}

export function AiAssistantProvider({ children, resumeId }: { children: React.ReactNode; resumeId: string }) {
	const queryClient = useQueryClient();
	const navigate = useNavigate({ from: "/builder/$resumeId" });
	const search = useSearch({ from: "/builder/$resumeId" });
	const currentResume = useCurrentResume();
	const confirm = useConfirm();
	const [open, setOpen] = useState(false);
	const [view, setView] = useState<AiAssistantView>("threads");
	const [threadId, setThreadId] = useState<string | null>(null);
	const [draft, setDraft] = useState<string | undefined>();

	const actionQueryKey = orpc.agent.actions.latestByResume.queryKey({ input: { resumeId } });
	const { data: actionData, isLoading } = useQuery(
		orpc.agent.actions.latestByResume.queryOptions({ input: { resumeId }, enabled: Boolean(resumeId) }),
	);
	const action = actionData ?? undefined;
	const snapshotData = useMemo<ResumeData | undefined>(
		() => (action?.snapshotData ? normalizeResumeData(action.snapshotData as ResumeData) : undefined),
		[action?.snapshotData],
	);
	const isActionVisible = Boolean(action && action.status === "applied" && snapshotData);
	const reviewData = useMemo(() => {
		if (!snapshotData || !action) return undefined;
		try {
			return applyResumePatches(snapshotData, action.operations);
		} catch {
			return undefined;
		}
	}, [snapshotData, action]);
	const changedPreviewSectionIds = useMemo(
		() =>
			isActionVisible && action && snapshotData
				? Array.from(getAffectedPreviewSectionIds(action.operations, snapshotData))
				: [],
		[action, isActionVisible, snapshotData],
	);
	const visibleChangedPreviewSectionIds = useMemo(() => {
		if (!isActionVisible || !action || !snapshotData || !reviewData) return [];
		return changedPreviewSectionIds.filter(
			(sectionId) => getSectionReviewGroups(action.operations, snapshotData, reviewData, sectionId).length > 0,
		);
	}, [action, changedPreviewSectionIds, reviewData, isActionVisible, snapshotData]);
	const changedSections = useMemo(() => {
		if (!isActionVisible || !action || !snapshotData || !reviewData) return [];
		return Array.from(getAffectedSections(action.operations)).filter(
			(section) => getSectionReviewGroups(action.operations, snapshotData, reviewData, section).length > 0,
		);
	}, [action, reviewData, isActionVisible, snapshotData]);
	const hasReviewableChanges = isActionVisible;
	const selectedReviewSectionId = useMemo(() => {
		const section = search.reviewSection ?? null;
		if (section && visibleChangedPreviewSectionIds.includes(section)) return section;
		return visibleChangedPreviewSectionIds[0] ?? null;
	}, [search.reviewSection, visibleChangedPreviewSectionIds]);

	const refreshAction = useCallback(() => {
		void queryClient.invalidateQueries({ queryKey: actionQueryKey });
		void refreshResumeFromServer(resumeId, queryClient).catch(() => {
			toast.error(t`Could not refresh the resume. Please try again.`);
		});
	}, [actionQueryKey, queryClient, resumeId]);

	const keepMutation = useMutation(orpc.agent.actions.keep.mutationOptions());
	const keep = useCallback(() => {
		if (!action) return;
		keepMutation.mutate(
			{ id: action.id },
			{
				onSuccess: () => {
					toast.success(t`AI changes kept.`);
					refreshAction();
				},
				onError: (error) => {
					toast.error(
						getAgentErrorMessage(error, t`Failed to keep AI changes.`, {
							PRECONDITION_FAILED: t`Keep or revert the pending AI review before applying another update.`,
						}),
					);
				},
			},
		);
	}, [action, keepMutation, refreshAction]);

	const revertMutation = useMutation(orpc.agent.actions.revert.mutationOptions());
	const revert = useCallback(async () => {
		if (!action) return;
		const confirmed = await confirm(t`Are you sure you want to revert these AI changes?`, {
			description: t`This will restore the resume to its previous version.`,
		});
		if (!confirmed) return;
		revertMutation.mutate(
			{ id: action.id },
			{
				onSuccess: () => {
					toast.success(t`AI changes reverted.`);
					refreshAction();
					void queryClient.invalidateQueries({
						queryKey: orpc.resume.getById.queryKey({ input: { id: resumeId } }),
					});
				},
				onError: (error) => {
					toast.error(
						getAgentErrorMessage(error, t`Failed to revert AI changes.`, {
							PRECONDITION_FAILED: t`Keep or revert the pending AI review before applying another update.`,
						}),
					);
				},
			},
		);
	}, [action, confirm, queryClient, refreshAction, resumeId, revertMutation]);

	const openThreads = useCallback(() => {
		setDraft(undefined);
		setThreadId(null);
		setView("threads");
		setOpen(true);
	}, []);
	const openChat = useCallback(
		(nextDraft?: string, preferredThreadId?: string) => {
			const nextThreadId = preferredThreadId ?? action?.threadId ?? null;
			setDraft(nextDraft);
			setThreadId(nextThreadId);
			setView(nextThreadId ? "chat" : "threads");
			setOpen(true);
		},
		[action?.threadId],
	);
	const selectThread = useCallback((nextThreadId: string) => {
		setThreadId(nextThreadId);
		setView("chat");
	}, []);
	const backToThreads = useCallback(() => {
		setDraft(undefined);
		setThreadId(null);
		setView("threads");
	}, []);
	const close = useCallback(() => setOpen(false), []);
	const focusChanges = useCallback(() => {
		const firstChangedSection = visibleChangedPreviewSectionIds[0];
		void navigate({
			search: (previous: BuilderSearch) => ({
				...previous,
				tab: "content",
				section: "ai-review",
				reviewSection: firstChangedSection,
			}),
		});
		setOpen(false);
	}, [navigate, visibleChangedPreviewSectionIds]);
	const selectReviewSection = useCallback(
		(sectionId: string) => {
			void navigate({ search: (previous: BuilderSearch) => ({ ...previous, reviewSection: sectionId }) });
		},
		[navigate],
	);
	const resolveSectionLabel = useCallback(
		(sectionId: string) => {
			if (leftSidebarSections.includes(sectionId as LeftSidebarSection)) {
				return getSectionTitle(sectionId as LeftSidebarSection).toLowerCase();
			}
			return (
				currentResume.data.customSections.find((section) => section.id === sectionId)?.title?.toLowerCase() ??
				getSectionTitle("custom").toLowerCase()
			);
		},
		[currentResume.data.customSections],
	);
	const continueWithAI = useCallback(
		async (sectionId: string, regenerate: boolean) => {
			if (keepMutation.isPending || revertMutation.isPending) return;
			const label = resolveSectionLabel(sectionId);
			if (action) {
				const confirmed = await confirm(t`Keep this update and continue with AI?`, {
					description: t`This keeps the entire pending update, including other sections. You can then request another change in chat.`,
					confirmText: t`Keep and continue`,
				});
				if (!confirmed) return;
				try {
					await keepMutation.mutateAsync({ id: action.id });
					refreshAction();
				} catch (error) {
					toast.error(
						getAgentErrorMessage(error, t`Failed to keep AI changes.`, {
							PRECONDITION_FAILED: t`Keep or revert the pending AI review before applying another update.`,
						}),
					);
					return;
				}
			}
			openChat(
				regenerate
					? t`Suggest an alternative version of my ${label} section. Preserve the facts and ask me before applying changes.`
					: t`Help me edit my ${label} section. Ask what I want to change before applying changes.`,
				action?.threadId,
			);
		},
		[action, confirm, keepMutation, revertMutation.isPending, resolveSectionLabel, refreshAction, openChat],
	);
	const regenerateSection = useCallback(
		(sectionId: string) => {
			void continueWithAI(sectionId, true);
		},
		[continueWithAI],
	);
	const editWithAI = useCallback(
		(sectionId: string) => {
			void continueWithAI(sectionId, false);
		},
		[continueWithAI],
	);
	const editManually = useCallback(
		(sectionId: string) => {
			const leftSection = leftSidebarSections.includes(sectionId as LeftSidebarSection)
				? (sectionId as LeftSidebarSection)
				: "custom";
			void navigate({ search: (previous: BuilderSearch) => ({ ...previous, tab: "content", section: leftSection }) });
			setOpen(false);
		},
		[navigate],
	);
	const clearDraft = useCallback(() => setDraft(undefined), []);

	const value = useMemo<AiAssistantContextValue>(
		() => ({
			resumeId,
			open,
			view,
			threadId,
			hasReviewableChanges,
			action,
			snapshotData,
			reviewData,
			changedSections,
			changedPreviewSectionIds,
			visibleChangedPreviewSectionIds,
			selectedReviewSectionId,
			draft,
			isReverting: revertMutation.isPending,
			isKeeping: keepMutation.isPending,
			isLoading,
			openThreads,
			openChat,
			selectThread,
			backToThreads,
			close,
			focusChanges,
			selectReviewSection,
			keep,
			regenerateSection,
			editWithAI,
			editManually,
			revert,
			clearDraft,
			refreshAction,
		}),
		[
			resumeId,
			open,
			view,
			threadId,
			hasReviewableChanges,
			action,
			snapshotData,
			reviewData,
			changedSections,
			changedPreviewSectionIds,
			visibleChangedPreviewSectionIds,
			selectedReviewSectionId,
			draft,
			revertMutation.isPending,
			keepMutation.isPending,
			isLoading,
			openThreads,
			openChat,
			selectThread,
			backToThreads,
			close,
			focusChanges,
			selectReviewSection,
			keep,
			regenerateSection,
			editWithAI,
			editManually,
			revert,
			clearDraft,
			refreshAction,
		],
	);

	return <AiAssistantContext.Provider value={value}>{children}</AiAssistantContext.Provider>;
}
