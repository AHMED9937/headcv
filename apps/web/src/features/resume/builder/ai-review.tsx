import type { LeftSidebarSection } from "@/libs/resume/section";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
	ArrowClockwiseIcon,
	ArrowRightIcon,
	ArrowUUpLeftIcon,
	CheckIcon,
	PencilSimpleIcon,
	SparkleIcon,
} from "@phosphor-icons/react";
import { Button } from "@headcv/ui/components/button";
import { diffText } from "@headcv/utils/diff";
import { stripHtml } from "@headcv/utils/string";
import { getSectionTitle, leftSidebarSections } from "@/libs/resume/section";
import { useAiAssistant } from "./ai-assistant";
import { getFieldLabel, getSectionDiffs, getSectionReviewGroups } from "./ai-changes";
import { useCurrentResume } from "./draft";

function plainTextFromHtml(value: string): string {
	return stripHtml(value.replace(/<\/(?:p|div|li|h[1-6])>|<br\s*\/?>/gi, "\n"));
}

function formatScalarReviewValue(value: unknown): string {
	if (value == null) return "";
	if (typeof value === "string") return plainTextFromHtml(value);
	if (typeof value === "boolean") return value ? t`Yes` : t`No`;
	if (typeof value === "number") return String(value);
	return "";
}

function formatReviewValue(value: unknown): string {
	if (value == null) return "—";
	if (typeof value === "string") return formatScalarReviewValue(value) || "—";
	if (Array.isArray(value)) {
		if (value.length === 0) return "—";
		if (value.every((item) => typeof item === "string")) return value.join("\n") || "—";
		return value.map(formatReviewValue).join("\n") || "—";
	}
	if (typeof value === "object") {
		const lines = Object.entries(value as Record<string, unknown>)
			.filter(([key]) => key !== "id")
			.map(([key, entry]) => `${getFieldLabel(`/${key}`)}: ${formatScalarReviewValue(entry) || "—"}`)
			.filter((line) => !line.endsWith("—"));
		return lines.length > 0 ? lines.join("\n") : "—";
	}
	return String(value);
}

function resolveSectionTitle(
	sectionId: string,
	resumeData: { customSections: { id: string; title?: string }[] } | undefined | null,
): string {
	if (leftSidebarSections.includes(sectionId as LeftSidebarSection)) {
		return getSectionTitle(sectionId as LeftSidebarSection);
	}
	return resumeData?.customSections.find((section) => section.id === sectionId)?.title ?? getSectionTitle("custom");
}

function AiStringDiff({ before, after }: { before: string; after: string }) {
	const parts = diffText(before, after);

	const renderParts = (mode: "before" | "after") =>
		parts.map((part, index) => {
			const key = `${part.type}-${index}`;
			if (part.type === "equal") return <span key={key}>{part.value}</span>;
			if (mode === "before") {
				if (part.type === "add") return null;
				return (
					<del
						key={key}
						className="rounded bg-rose-200/60 px-0.5 text-rose-900 line-through decoration-rose-500 dark:bg-rose-900/40 dark:text-rose-100"
					>
						{part.value}
					</del>
				);
			}
			if (part.type === "remove") return null;
			return (
				<ins
					key={key}
					className="rounded bg-green-200/60 px-0.5 text-green-900 no-underline dark:bg-green-900/40 dark:text-green-100"
				>
					{part.value}
				</ins>
			);
		});

	const hasBefore = before.trim().length > 0;
	const hasAfter = after.trim().length > 0;

	return (
		<div className="grid gap-2">
			<p className="sr-only">{t`Before: ${before}. After AI update: ${after}.`}</p>
			<div className="rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-900 dark:bg-rose-950/30">
				<p className="mb-2 font-semibold">
					<Trans>Before</Trans>
				</p>
				<p className="whitespace-pre-wrap break-words leading-relaxed">{hasBefore ? renderParts("before") : "—"}</p>
			</div>
			<div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/30">
				<p className="mb-2 font-semibold">
					<Trans>After AI update</Trans>
				</p>
				<p className="whitespace-pre-wrap break-words leading-relaxed">{hasAfter ? renderParts("after") : "—"}</p>
			</div>
		</div>
	);
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function ArrayItem({ children, variant }: { children: string; variant: "equal" | "add" | "remove" }) {
	return (
		<li
			className={
				variant === "add"
					? "text-green-800 dark:text-green-100"
					: variant === "remove"
						? "text-rose-800 line-through decoration-rose-500 dark:text-rose-100"
						: ""
			}
		>
			{children}
		</li>
	);
}

function AiArrayDiff({ before, after }: { before: unknown; after: unknown }) {
	const beforeArray = isStringArray(before) ? before : [];
	const afterArray = isStringArray(after) ? after : [];
	const beforeSet = new Set(beforeArray);
	const afterSet = new Set(afterArray);

	if (beforeArray.length === 0 && afterArray.length === 0) {
		return <p className="text-muted-foreground text-sm">—</p>;
	}

	return (
		<div className="grid gap-2">
			<div className="rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-900 dark:bg-rose-950/30">
				<p className="mb-2 font-semibold">
					<Trans>Before</Trans>
				</p>
				{beforeArray.length === 0 ? (
					<p className="text-muted-foreground text-sm">—</p>
				) : (
					<ul className="list-disc space-y-1 ps-5 text-sm">
						{beforeArray.map((item, index) => (
							<ArrayItem key={`before-${index}`} variant={afterSet.has(item) ? "equal" : "remove"}>
								{item}
							</ArrayItem>
						))}
					</ul>
				)}
			</div>
			<div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/30">
				<p className="mb-2 font-semibold">
					<Trans>After AI update</Trans>
				</p>
				{afterArray.length === 0 ? (
					<p className="text-muted-foreground text-sm">—</p>
				) : (
					<ul className="list-disc space-y-1 ps-5 text-sm">
						{afterArray.map((item, index) => (
							<ArrayItem key={`after-${index}`} variant={beforeSet.has(item) ? "equal" : "add"}>
								{item}
							</ArrayItem>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}

function ReviewValueDiff({ before, after }: { before: unknown; after: unknown }) {
	if (typeof before === "string" && typeof after === "string") {
		return <AiStringDiff before={plainTextFromHtml(before)} after={plainTextFromHtml(after)} />;
	}
	if (isStringArray(before) && isStringArray(after)) {
		return <AiArrayDiff before={before} after={after} />;
	}

	return (
		<div className="grid gap-2">
			<div className="rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-900 dark:bg-rose-950/30">
				<p className="mb-2 font-semibold">
					<Trans>Before</Trans>
				</p>
				<p className="whitespace-pre-wrap break-words leading-relaxed">{formatReviewValue(before)}</p>
			</div>
			<div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/30">
				<p className="mb-2 font-semibold">
					<Trans>After AI update</Trans>
				</p>
				<p className="whitespace-pre-wrap break-words leading-relaxed">{formatReviewValue(after)}</p>
			</div>
		</div>
	);
}

function SectionActions({
	sectionId,
	editManually,
	editWithAI,
	regenerateSection,
	isBusy,
}: {
	sectionId: string;
	editManually: (sectionId: string) => void;
	editWithAI: (sectionId: string) => void;
	regenerateSection: (sectionId: string) => void;
	isBusy: boolean;
}) {
	return (
		<div className="flex flex-wrap gap-2">
			<Button size="sm" variant="outline" className="gap-1.5" disabled={isBusy} onClick={() => editManually(sectionId)}>
				<PencilSimpleIcon className="size-3.5" weight="bold" />
				<Trans>Edit manually</Trans>
			</Button>
			<Button
				size="sm"
				variant="outline"
				className="gap-1.5 text-green-700 hover:text-green-800 dark:text-green-300 dark:hover:text-green-200"
				disabled={isBusy}
				onClick={() => editWithAI(sectionId)}
			>
				<SparkleIcon className="size-3.5" weight="fill" />
				<Trans>Edit with AI</Trans>
			</Button>
			<Button
				size="sm"
				variant="outline"
				className="gap-1.5"
				disabled={isBusy}
				onClick={() => regenerateSection(sectionId)}
			>
				<ArrowClockwiseIcon className="size-3.5" weight="bold" />
				<Trans>Regenerate</Trans>
			</Button>
		</div>
	);
}

export function AiReviewWorkspace() {
	const {
		action,
		snapshotData,
		reviewData,
		visibleChangedPreviewSectionIds,
		changedPreviewSectionIds = [],
		selectedReviewSectionId,
		keep,
		revert,
		regenerateSection,
		editWithAI,
		editManually,
		isKeeping,
		isReverting,
	} = useAiAssistant();
	const currentData = useCurrentResume().data;

	if (!action || !snapshotData) {
		return (
			<div className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-muted/20 p-8 text-center">
				<SparkleIcon className="size-8 text-muted-foreground" />
				<p className="text-muted-foreground text-sm">
					<Trans>No AI-suggested changes to review right now.</Trans>
				</p>
			</div>
		);
	}

	const hasVisibleSections = visibleChangedPreviewSectionIds.length > 0;
	const sectionsToShow = hasVisibleSections ? visibleChangedPreviewSectionIds : changedPreviewSectionIds;
	const isBusy = isKeeping || isReverting;
	const titleSource = reviewData ?? currentData;

	return (
		<div className="space-y-5">
			<div className="flex items-start gap-3">
				<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white">
					<SparkleIcon className="size-5" weight="fill" />
				</div>
				<div>
					<h2 className="font-display font-semibold text-2xl text-foreground">
						<Trans>AI Review</Trans>
					</h2>
					<p className="mt-1 text-muted-foreground text-sm">
						<Trans>Keep or revert this update before requesting another AI change.</Trans>
					</p>
				</div>
			</div>

			<div className="rounded-2xl border bg-background p-5 shadow-sm">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
					<div>
						<h3 className="font-semibold text-foreground">{action.title}</h3>
						{action.summary ? <p className="mt-1 text-muted-foreground text-sm">{action.summary}</p> : null}
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							className="gap-1.5 text-green-700 hover:text-green-800 dark:text-green-300 dark:hover:text-green-200"
							disabled={isBusy}
							onClick={keep}
						>
							<CheckIcon className="size-4" weight="bold" />
							<Trans>Keep</Trans>
						</Button>
						<Button variant="destructive" className="gap-1.5" disabled={isBusy} onClick={revert}>
							<ArrowUUpLeftIcon className="size-4" weight="bold" />
							<Trans>Revert</Trans>
						</Button>
					</div>
				</div>

				<div className="max-h-[calc(100svh-24rem)] overflow-y-auto">
					<p className="py-3 text-muted-foreground text-sm">
						<Trans>
							This compares the saved version before the AI update with the AI's changes. Later manual edits are not
							included.
						</Trans>
					</p>
					{!hasVisibleSections && changedPreviewSectionIds.length > 0 ? (
						<p className="py-3 text-muted-foreground text-sm">
							<Trans>
								No change details are available for this update. You can still keep or revert it, or edit the affected
								sections below.
							</Trans>
						</p>
					) : null}
					<div className="divide-y">
						{sectionsToShow.map((sectionId) => {
							const isSelected = selectedReviewSectionId === sectionId;
							if (hasVisibleSections && reviewData) {
								const groups = getSectionReviewGroups(action.operations, snapshotData, reviewData, sectionId);
								const diffs = getSectionDiffs(action.operations, snapshotData, reviewData, sectionId);
								if (groups.length === 0) return null;
								return (
									<section
										key={sectionId}
										className={
											isSelected
												? "rounded-xl border border-green-200 bg-green-50/50 p-4 dark:border-green-900 dark:bg-green-950/20"
												: "py-4"
										}
									>
										<div className="flex flex-wrap items-center justify-between gap-3">
											<h4 className="font-semibold">{resolveSectionTitle(sectionId, titleSource)}</h4>
											<Button
												size="sm"
												variant="ghost"
												className="gap-1.5 text-green-700 hover:text-green-800 dark:text-green-300 dark:hover:text-green-200"
												onClick={() => editManually(sectionId)}
											>
												<Trans>Go to section</Trans>
												<ArrowRightIcon className="size-3.5" />
											</Button>
										</div>
										<div className="my-3">
											<SectionActions
												sectionId={sectionId}
												editManually={editManually}
												editWithAI={editWithAI}
												regenerateSection={regenerateSection}
												isBusy={isBusy}
											/>
										</div>
										<ul className="my-3 space-y-2">
											{groups.map((group) => (
												<li
													key={group.entityPath}
													className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 p-2 text-sm"
												>
													<span className="font-medium">{group.title}</span>
													<span className="text-muted-foreground text-xs">{group.fieldLabels.join(", ")}</span>
												</li>
											))}
										</ul>
										{diffs.map((diff, index) => (
											<div key={`${diff.path}-${index}`} className="my-3 space-y-2 text-sm">
												<p className="font-medium">{getFieldLabel(diff.path)}</p>
												<ReviewValueDiff before={diff.before} after={diff.after} />
											</div>
										))}
									</section>
								);
							}

							return (
								<section
									key={sectionId}
									className={
										isSelected
											? "rounded-xl border border-green-200 bg-green-50/50 p-4 dark:border-green-900 dark:bg-green-950/20"
											: "py-4"
									}
								>
									<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
										<h4 className="font-semibold">{resolveSectionTitle(sectionId, titleSource)}</h4>
										<SectionActions
											sectionId={sectionId}
											editManually={editManually}
											editWithAI={editWithAI}
											regenerateSection={regenerateSection}
											isBusy={isBusy}
										/>
									</div>
								</section>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
