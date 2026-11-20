import type { DesignWorkspaceSection, LeftSidebarSection } from "@/libs/resume/section";
import type { BuilderSearch, WorkspaceTab } from "./-components/workspace-search";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useBuilderStep } from "@/features/builder/use-builder-step";
import { AiAssistantProvider } from "@/features/resume/builder/ai-assistant";
import { AiAssistantBanner } from "@/features/resume/builder/ai-assistant-banner";
import { AiAssistantFab } from "@/features/resume/builder/ai-assistant-fab";
import { AiAssistantPanel } from "@/features/resume/builder/ai-assistant-panel";
import {
	useInitializeResumeStore,
	useMergeResumeMetadata,
	useResumeCleanup,
	useResumeStore,
	useResumeUpdateSubscription,
} from "@/features/resume/builder/draft";
import { orpc } from "@/libs/orpc/client";
import { createNoindexFollowMeta } from "@/libs/seo";
import { GuidedEditor } from "./-components/guided-editor";
import { BuilderHeader } from "./-components/header";
import { ImportedWorkspace } from "./-components/imported-workspace";
import { BuilderSplitView } from "./-components/split-view";
import { builderSearchSchema, DEFAULT_CONTENT_SECTION, DEFAULT_DESIGN_SECTION } from "./-components/workspace-search";

export const Route = createFileRoute("/builder/$resumeId")({
	component: RouteComponent,
	validateSearch: builderSearchSchema,
	beforeLoad: async ({ context }) => {
		if (!context.session) throw redirect({ to: "/auth/login", replace: true });
		return { session: context.session };
	},
	loader: async ({ params, context }) => {
		const resume = await context.queryClient.ensureQueryData(
			orpc.resume.getById.queryOptions({ input: { id: params.resumeId } }),
		);

		return { name: resume.name };
	},
	head: ({ loaderData }) => ({
		meta: loaderData
			? [{ title: `${loaderData.name} - HeadCV` }, createNoindexFollowMeta()]
			: [createNoindexFollowMeta()],
	}),
});

function RouteComponent() {
	const { resumeId } = Route.useParams();
	const { data: resume } = useSuspenseQuery(orpc.resume.getById.queryOptions({ input: { id: resumeId } }));
	const initializeResumeStore = useInitializeResumeStore();
	const mergeResumeMetadata = useMergeResumeMetadata();
	const isReady = useResumeStore((state) => state.isReady);
	const initializedResumeId = useResumeStore((state) => state.resumeId);
	const isInitialized = isReady && initializedResumeId === resumeId;

	useResumeCleanup();
	useResumeUpdateSubscription();

	useEffect(() => {
		if (isInitialized) return;
		initializeResumeStore(resume);
	}, [initializeResumeStore, isInitialized, resume]);

	useEffect(() => {
		mergeResumeMetadata(resume);
	}, [
		mergeResumeMetadata,
		resume.id,
		resume.name,
		resume.slug,
		resume.tags,
		resume.isLocked,
		resume.isPublic,
		resume.hasPassword,
		resume.updatedAt,
		resume,
	]);

	if (!isInitialized) return null;

	return (
		<AiAssistantProvider resumeId={resumeId}>
			<BuilderLayoutShell />
			<AiAssistantPanel />
			<AiAssistantFab />
		</AiAssistantProvider>
	);
}

function BuilderLayoutShell() {
	const {
		mode,
		tab = "content",
		section = DEFAULT_CONTENT_SECTION,
		designSection = DEFAULT_DESIGN_SECTION,
	} = Route.useSearch();

	if (mode === "create") return <GuidedBuilderShell />;
	return (
		<ImportedBuilderShell tab={tab} section={section} designSection={designSection} isImported={mode === "import"} />
	);
}

function GuidedBuilderShell() {
	const { currentStep, setStep } = useBuilderStep();

	return (
		<div className="flex h-svh min-h-0 flex-col overflow-hidden pt-16">
			<BuilderHeader compact progress={{ currentStep, onChange: setStep }} />
			<AiAssistantBanner />
			<BuilderSplitView editor={<GuidedEditor />} preview={<Outlet />} />
		</div>
	);
}

function ImportedBuilderShell({
	tab,
	section,
	designSection,
	isImported,
}: {
	tab: WorkspaceTab;
	section: LeftSidebarSection;
	designSection: DesignWorkspaceSection;
	isImported: boolean;
}) {
	const navigate = useNavigate({ from: Route.fullPath });

	return (
		<div className="flex h-svh min-h-0 flex-col overflow-hidden pt-[7.5rem] md:pt-16">
			<BuilderHeader
				compact
				workspace={{
					activeTab: tab,
					onChange: (nextTab) => {
						void navigate({ search: (previous: BuilderSearch) => ({ ...previous, tab: nextTab }) });
					},
				}}
			/>
			<AiAssistantBanner />
			<ImportedWorkspace
				tab={tab}
				section={section}
				designSection={designSection}
				isImported={isImported}
				onSectionChange={(nextSection) => {
					void navigate({
						search: (previous: BuilderSearch) => ({ ...previous, tab: "content", section: nextSection }),
					});
				}}
				onDesignSectionChange={(nextSection) => {
					void navigate({
						search: (previous: BuilderSearch) => ({
							...previous,
							tab: "design",
							designSection: nextSection,
						}),
					});
				}}
				preview={<Outlet />}
			/>
		</div>
	);
}
