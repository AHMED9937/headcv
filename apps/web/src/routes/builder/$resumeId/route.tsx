import type { DesignWorkspaceSection, LeftSidebarSection } from "@/libs/resume/section";
import type { MobileBuilderView } from "./-components/mobile-view-switch";
import type { BuilderSearch, WorkspaceTab } from "./-components/workspace-search";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { orpc } from "@/libs/orpc/client";
import { createNoindexFollowMeta } from "@/libs/seo";
import { GuidedEditor } from "./-components/guided-editor";
import { BuilderHeader } from "./-components/header";
import { ImportedWorkspace } from "./-components/imported-workspace";
import { MobileViewSwitch } from "./-components/mobile-view-switch";
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
	const isMobile = useIsMobile();
	const [mobileView, setMobileView] = useState<MobileBuilderView>("editor");
	const { currentStep, setStep } = useBuilderStep();

	return (
		<div className="flex h-svh flex-col pt-16">
			<BuilderHeader compact progress={{ currentStep, onChange: setStep }} />
			<AiAssistantBanner />

			{isMobile ? (
				<div className="flex min-h-0 flex-1 flex-col">
					<MobileViewSwitch value={mobileView} onChange={setMobileView} />
					<div className="min-h-0 flex-1">{mobileView === "editor" ? <GuidedEditor /> : <Outlet />}</div>
				</div>
			) : (
				<div className="grid min-h-0 flex-1 grid-cols-[minmax(25rem,45%)_minmax(0,1fr)]">
					<div className="min-h-0 bg-background">
						<GuidedEditor />
					</div>
					<div className="min-h-0 bg-muted/30">
						<Outlet />
					</div>
				</div>
			)}
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
		<div className="flex h-svh flex-col pt-[7.5rem] md:pt-16">
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
