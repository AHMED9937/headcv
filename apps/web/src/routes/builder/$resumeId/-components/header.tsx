import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { BuilderStepId } from "@/features/builder/steps";
import type { WorkspaceTab } from "./workspace-search";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
	CaretDownIcon,
	CheckCircleIcon,
	CopySimpleIcon,
	DotsThreeIcon,
	DownloadSimpleIcon,
	HouseSimpleIcon,
	LockSimpleIcon,
	LockSimpleOpenIcon,
	PaletteIcon,
	PencilSimpleLineIcon,
	SidebarSimpleIcon,
	SparkleIcon,
	TrashSimpleIcon,
} from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@headcv/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@headcv/ui/components/dropdown-menu";
import { cn } from "@headcv/utils/style";
import { useDialogStore } from "@/dialogs/store";
import { BUILDER_STEPS, getStepLabel, isStepComplete, isStepSkipped } from "@/features/builder/steps";
import { useAiAssistant } from "@/features/resume/builder/ai-assistant";
import { useCurrentResume, usePatchResume } from "@/features/resume/builder/draft";
import { useConfirm } from "@/hooks/use-confirm";
import { getResumeErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";
import { useBuilderSidebar } from "../-store/sidebar";

type BuilderHeaderProps = {
	compact?: boolean;
	workspace?: {
		activeTab: WorkspaceTab;
		onChange: (tab: WorkspaceTab) => void;
	};
	progress?: {
		currentStep: BuilderStepId;
		onChange: (step: BuilderStepId) => void;
	};
};

const workspaceTabs: { id: WorkspaceTab; label: ReactNode; icon: Icon }[] = [
	{ id: "content", label: t`Content`, icon: PencilSimpleLineIcon },
	{ id: "design", label: t`Design`, icon: PaletteIcon },
	{ id: "review", label: t`Review`, icon: CheckCircleIcon },
	{ id: "export", label: t`Export`, icon: DownloadSimpleIcon },
];

export function BuilderHeader({ compact = false, workspace, progress }: BuilderHeaderProps) {
	const resume = useCurrentResume();
	const { openThreads, hasReviewableChanges } = useAiAssistant();
	const name = resume.name;
	const isLocked = resume.isLocked;
	const toggleSidebar = useBuilderSidebar((state) => state.toggleSidebar);
	const guidedSteps = BUILDER_STEPS.filter((step) => step.id !== "setup" && step.id !== "template");
	const progressIndex = progress ? guidedSteps.findIndex((step) => step.id === progress.currentStep) : -1;

	return (
		<div
			className={cn(
				"absolute inset-x-0 top-0 z-50 min-h-16 items-center gap-3 border-primary/15 border-b bg-background/95 px-3 py-2 shadow-sm backdrop-blur md:flex md:gap-5 md:px-5",
				workspace ? "grid grid-cols-[minmax(0,1fr)_auto]" : "flex",
			)}
		>
			{!compact ? (
				<Button size="icon" variant="ghost" onClick={() => toggleSidebar("left")}>
					<SidebarSimpleIcon />
					<span className="sr-only">
						<Trans comment="Screen-reader label for opening or closing the left sidebar in resume builder">
							Toggle left sidebar
						</Trans>
					</span>
				</Button>
			) : null}

			<div className="flex min-w-0 items-center gap-x-2 text-sm sm:shrink-0">
				<Button
					size="icon"
					variant="ghost"
					className="size-10 shrink-0"
					aria-label={t({
						comment: "Accessible label for button navigating from builder to resumes dashboard",
						message: "Go to resumes dashboard",
					})}
					nativeButton={false}
					render={
						<Link to="/dashboard/resumes" search={{ sort: "lastUpdatedAt", tags: [] }}>
							<HouseSimpleIcon className="size-5" />
						</Link>
					}
				/>
				<div className="hidden h-8 w-px bg-border sm:block" aria-hidden="true" />
				<div className="min-w-0">
					<span className="hidden font-medium text-[0.65rem] text-muted-foreground uppercase tracking-[0.12em] sm:block">
						HeadCV
					</span>
					<h2 className="truncate font-bold text-base text-foreground sm:max-w-[14rem]" title={name}>
						{name}
					</h2>
				</div>
				{isLocked && <LockSimpleIcon className="ms-2 text-muted-foreground" />}
			</div>

			{workspace && (
				<nav
					className="order-last col-span-2 min-w-0 border-primary/10 border-t pt-1 md:order-none md:col-auto md:flex-1 md:border-0 md:pt-0"
					aria-label={t`Resume workspace`}
				>
					<div className="grid w-full grid-cols-4 items-center gap-1 md:mx-auto md:flex md:w-fit md:max-w-full md:rounded-2xl md:border md:border-primary/10 md:bg-muted/60 md:p-1">
						{workspaceTabs.map((tab) => (
							<button
								key={tab.id}
								type="button"
								onClick={() => workspace.onChange(tab.id)}
								className={cn(
									"relative flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg px-1 font-semibold text-xs transition-colors hover:bg-muted hover:text-primary md:min-h-0 md:whitespace-nowrap md:rounded-xl md:px-4 md:py-2 md:text-sm",
									workspace.activeTab === tab.id
										? "bg-primary/10 text-primary after:absolute after:inset-x-3 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-primary md:bg-primary md:text-primary-foreground md:shadow-md md:hover:bg-primary md:hover:text-primary-foreground md:after:hidden"
										: "text-muted-foreground",
								)}
								aria-current={workspace.activeTab === tab.id ? "page" : undefined}
							>
								<tab.icon className="size-4 shrink-0" aria-hidden="true" />
								<span className="min-w-0 truncate">{tab.label}</span>
							</button>
						))}
					</div>
				</nav>
			)}

			{progress && (
				<div className="flex min-w-0 flex-1 justify-center">
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<button
									type="button"
									className="group flex min-w-0 max-w-xs items-center gap-2.5 rounded-full border border-border/70 bg-background/90 px-3.5 py-1.5 text-start transition-all hover:border-primary/40 hover:bg-muted/60 hover:shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-sm"
								>
									<span className="flex shrink-0 items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 font-bold font-mono text-primary text-xs tracking-tight">
										{Math.max(progressIndex + 1, 1)} / {guidedSteps.length}
									</span>
									<span className="truncate font-semibold text-foreground text-sm transition-colors group-hover:text-primary">
										{getStepLabel(progress.currentStep)}
									</span>
									<CaretDownIcon className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:text-foreground group-data-[state=open]:rotate-180" />
								</button>
							}
						/>
						<DropdownMenuContent align="center" className="w-72 p-2">
							<div className="flex items-center justify-between px-2 py-1 font-semibold text-[0.65rem] text-muted-foreground uppercase tracking-wider">
								<span>
									<Trans>Builder Steps</Trans>
								</span>
								<span className="font-mono text-[0.65rem]">
									{Math.max(progressIndex + 1, 1)} / {guidedSteps.length}
								</span>
							</div>
							<div className="my-1 h-px bg-border/60" />
							<div className="max-h-80 space-y-0.5 overflow-y-auto">
								{guidedSteps.map((step, index) => {
									const isCurrent = step.id === progress.currentStep;
									const isCompleted = isStepComplete(step.id, resume);
									const isSkipped = isStepSkipped(step.id, resume);

									return (
										<DropdownMenuItem
											key={step.id}
											onClick={() => progress.onChange(step.id)}
											className={cn(
												"flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
												isCurrent && "bg-primary/10 font-semibold text-primary",
											)}
										>
											<div className="flex size-5 shrink-0 items-center justify-center">
												{isCompleted && !isSkipped ? (
													<CheckCircleIcon className="size-4 text-emerald-500" />
												) : isSkipped ? (
													<DotsThreeIcon className="size-4 text-muted-foreground" />
												) : (
													<span
														className={cn(
															"font-mono text-xs",
															isCurrent ? "font-bold text-primary" : "text-muted-foreground",
														)}
													>
														{index + 1}
													</span>
												)}
											</div>

											<span className="flex-1 truncate">{getStepLabel(step.id)}</span>

											{isSkipped && (
												<span className="text-muted-foreground text-xs">
													<Trans>Skipped</Trans>
												</span>
											)}
										</DropdownMenuItem>
									);
								})}
							</div>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			)}

			<div className="ms-auto flex shrink-0 items-center gap-1">
				<Button
					size="sm"
					variant={hasReviewableChanges ? "default" : "outline"}
					className="hidden h-8 gap-1.5 md:inline-flex"
					onClick={openThreads}
				>
					<SparkleIcon className="size-4" />
					<Trans>AI</Trans>
					{hasReviewableChanges ? <span className="ml-1.5 flex size-2 rounded-full bg-white" /> : null}
				</Button>
				<BuilderHeaderDropdown />
				{!compact ? (
					<Button size="icon" variant="ghost" onClick={() => toggleSidebar("right")}>
						<SidebarSimpleIcon className="-scale-x-100" />
						<span className="sr-only">
							<Trans comment="Screen-reader label for opening or closing the right sidebar in resume builder">
								Toggle right sidebar
							</Trans>
						</span>
					</Button>
				) : null}
			</div>
		</div>
	);
}

function BuilderHeaderDropdown() {
	const confirm = useConfirm();
	const navigate = useNavigate();
	const { openDialog } = useDialogStore();

	const resume = useCurrentResume();
	const patchResume = usePatchResume();
	const id = resume.id;
	const name = resume.name;
	const slug = resume.slug;
	const tags = resume.tags;
	const isLocked = resume.isLocked;

	const { mutate: deleteResume } = useMutation(orpc.resume.delete.mutationOptions());
	const { mutate: setLockedResume } = useMutation(orpc.resume.setLocked.mutationOptions());

	const handleUpdate = () => {
		openDialog("resume.update", { id, name, slug, tags });
	};

	const handleDuplicate = () => {
		openDialog("resume.duplicate", { id, name, slug, tags, shouldRedirect: true });
	};

	const handleToggleLock = async () => {
		if (!isLocked) {
			const confirmation = await confirm(t`Are you sure you want to lock this resume?`, {
				description: t`When locked, the resume cannot be updated or deleted.`,
			});

			if (!confirmation) return;
		}

		setLockedResume(
			{ id, isLocked: !isLocked },
			{
				onSuccess: () => {
					patchResume((draft) => {
						draft.isLocked = !isLocked;
					});
				},
				onError: (error) => {
					toast.error(getResumeErrorMessage(error));
				},
			},
		);
	};

	const handleDelete = async () => {
		const confirmation = await confirm(t`Are you sure you want to delete this resume?`, {
			description: t`This action cannot be undone.`,
		});

		if (!confirmation) return;

		const toastId = toast.loading(t`Deleting your resume...`);

		deleteResume(
			{ id },
			{
				onSuccess: () => {
					toast.success(t`Your resume has been deleted successfully.`, { id: toastId });
					void navigate({ to: "/dashboard/resumes", search: { sort: "lastUpdatedAt", tags: [] } });
				},
				onError: (error) => {
					toast.error(getResumeErrorMessage(error), { id: toastId });
				},
			},
		);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						size="sm"
						variant="outline"
						className="size-11 gap-2 px-0 md:h-8 md:w-auto md:px-3"
						aria-label={t`Resume actions`}
					>
						<DotsThreeIcon className="size-4" aria-hidden="true" />
						<span className="hidden md:inline">
							<Trans>More</Trans>
						</span>
					</Button>
				}
			/>

			<DropdownMenuContent>
				<DropdownMenuItem disabled={isLocked} onClick={handleUpdate}>
					<PencilSimpleLineIcon className="me-2" />
					<Trans>Update</Trans>
				</DropdownMenuItem>

				<DropdownMenuItem onClick={handleDuplicate}>
					<CopySimpleIcon className="me-2" />
					<Trans>Duplicate</Trans>
				</DropdownMenuItem>

				<DropdownMenuItem onClick={handleToggleLock}>
					{isLocked ? <LockSimpleOpenIcon className="me-2" /> : <LockSimpleIcon className="me-2" />}
					{isLocked ? <Trans>Unlock</Trans> : <Trans>Lock</Trans>}
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				<DropdownMenuItem variant="destructive" disabled={isLocked} onClick={handleDelete}>
					<TrashSimpleIcon className="me-2" />
					<Trans>Delete</Trans>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
