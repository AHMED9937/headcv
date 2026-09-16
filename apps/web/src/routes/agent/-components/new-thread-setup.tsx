import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { ArrowRightIcon, ChatCircleDotsIcon, FilePlusIcon } from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useIsClient } from "usehooks-ts";
import { Badge } from "@headcv/ui/components/badge";
import { Button } from "@headcv/ui/components/button";
import { Label } from "@headcv/ui/components/label";
import { Spinner } from "@headcv/ui/components/spinner";
import { Combobox } from "@/components/ui/combobox";
import { getOrpcErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";

function isAgentConfigError(error: unknown) {
	if (!error || typeof error !== "object") return false;
	const message = (error as { message?: unknown }).message;
	const status = (error as { status?: unknown; code?: unknown }).status ?? (error as { code?: unknown }).code;
	if (status === "PRECONDITION_FAILED" || status === 412) return true;
	return typeof message === "string" && /REDIS_URL/.test(message);
}

export function NewThreadSetup({ resumeId, draft }: { resumeId?: string; draft?: string }) {
	const isClient = useIsClient();
	const navigate = useNavigate();
	const {
		data: providers,
		isLoading: isLoadingProviders,
		error: providersError,
	} = useQuery(orpc.aiProviders.list.queryOptions());
	const { data: resumes, isLoading: isLoadingResumes } = useQuery(
		orpc.resume.list.queryOptions({ input: { sort: "lastUpdatedAt", tags: [] } }),
	);
	const { mutate: createThread, isPending } = useMutation(orpc.agent.threads.create.mutationOptions());

	const hasProvider = (providers?.length ?? 0) > 0;
	const [sourceResumeIdOverride, setSourceResumeIdOverride] = useState<string | null | undefined>(undefined);
	const sourceResumeId = sourceResumeIdOverride ?? resumeId ?? null;

	const resumeOptions = [
		{ value: "__scratch__", label: t`Create from scratch` },
		...(resumes?.map((resume) => ({
			value: resume.id,
			label: resume.name,
			keywords: [resume.name, resume.slug, ...resume.tags],
		})) ?? []),
	];

	const selectedResumeValue = sourceResumeId ?? "__scratch__";
	const canCreate = hasProvider && !isLoadingResumes && !isPending;

	if (!isClient) return null;

	return (
		<div className="mx-auto grid w-full max-w-4xl gap-6 self-center p-4 lg:p-6">
			<div className="flex items-start gap-4">
				<div className="grid size-12 shrink-0 place-items-center rounded-md border bg-card shadow-sm lg:size-14">
					<ChatCircleDotsIcon className="size-6 text-foreground" weight="fill" />
				</div>
				<div className="min-w-0">
					<h1 className="font-semibold text-3xl tracking-tight lg:text-4xl">
						<Trans>Start a thread</Trans>
					</h1>
					<p className="mt-1 text-muted-foreground">
						<Trans>Choose a resume draft to get started.</Trans>
					</p>
				</div>
			</div>

			{providersError ? (
				<div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-950 text-sm dark:bg-amber-950/20 dark:text-amber-200">
					{isAgentConfigError(providersError) ? (
						<Trans>AI agent setup is unavailable until REDIS_URL is configured.</Trans>
					) : (
						<Trans>AI agent setup is unavailable right now. Please try again in a moment.</Trans>
					)}
				</div>
			) : null}

			{!hasProvider && !isLoadingProviders ? (
				<div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-950 text-sm dark:bg-amber-950/20 dark:text-amber-200">
					<Trans>AI provider is not configured in the environment.</Trans>
				</div>
			) : null}

			<div className="rounded-md border bg-card p-4 shadow-sm lg:p-6">
				<div className="grid gap-x-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
					<div className="relative isolate min-h-32 overflow-hidden rounded-md p-1 lg:p-2">
						<span
							aria-hidden="true"
							className="pointer-events-none absolute -top-7 right-1 -z-10 select-none font-black text-8xl text-foreground/[0.045] leading-none lg:-top-10 lg:right-3 lg:text-[8rem]"
						>
							1
						</span>
						<div className="space-y-3">
							<Label>
								<Trans>Select a resume</Trans>
							</Label>
							<Combobox
								value={selectedResumeValue}
								showClear={false}
								options={resumeOptions}
								disabled={isLoadingResumes}
								placeholder={isLoadingResumes ? t`Loading resumes…` : t`Choose a resume`}
								onValueChange={(value) => setSourceResumeIdOverride(value && value !== "__scratch__" ? value : null)}
							/>
							<div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
								<Badge variant="secondary" className="h-7 gap-1.5 rounded-md px-2">
									<FilePlusIcon />
									{sourceResumeId ? <Trans>Duplicate as AI Draft</Trans> : <Trans>Blank draft</Trans>}
								</Badge>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-2 flex border-t pt-5 lg:justify-end">
					<Button
						size="lg"
						className="h-11 w-full gap-2 px-5 lg:w-auto"
						disabled={!canCreate}
						onClick={() =>
							createThread(
								{
									...(sourceResumeId ? { sourceResumeId } : {}),
								},
								{
									onSuccess: (thread) => {
										void navigate({
											to: "/agent/$threadId",
											params: { threadId: thread.id },
											search: draft ? { draft } : undefined,
										});
									},
									onError: (error) =>
										toast.error(
											getOrpcErrorMessage(error, {
												byCode: {
													PRECONDITION_FAILED: t`AI agent setup is unavailable until REDIS_URL is configured.`,
													BAD_REQUEST: t`AI provider is not configured.`,
												},
												fallback: t`Failed to start agent thread.`,
											}),
										),
								},
							)
						}
					>
						<Trans>Start Thread</Trans>
						{isPending ? <Spinner /> : <ArrowRightIcon />}
					</Button>
				</div>
			</div>
		</div>
	);
}
