import type { Template } from "@headcv/schema/templates";
import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { CheckIcon, SlideshowIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { defaultResumeData } from "@headcv/schema/resume/default";
import { templateSchema } from "@headcv/schema/templates";
import { Button } from "@headcv/ui/components/button";
import { generateId, slugify } from "@headcv/utils/string";
import { cn } from "@headcv/utils/style";
import { templates } from "@/dialogs/resume/template/data";
import { getResumeErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";

export const Route = createFileRoute("/templates/")({
	validateSearch: (search: Record<string, unknown>): { template?: Template } => ({
		template: templateSchema.safeParse(search.template).data,
	}),
	component: TemplateGalleryPage,
});

const categoryOptions = ["All", "ATS friendly", "Professional", "Modern", "Creative"] as const;

// Alternate layout density, sidebar placement, and visual character so adjacent cards are easy to compare.
const templateGalleryOrder = [
	"rhyhorn",
	"chikorita",
	"lapras",
	"pikachu",
	"bronzor",
	"azurill",
	"scizor",
	"leafish",
	"kakuna",
	"ditgar",
	"onyx",
	"gengar",
	"meowth",
	"glalie",
	"ditto",
] as const satisfies readonly Template[];

function TemplateGalleryPage() {
	const { i18n } = useLingui();
	const search = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const [category, setCategory] = useState<(typeof categoryOptions)[number]>("All");
	const [chosenTemplate, setSelectedTemplate] = useState<Template>();
	const selectedTemplate = chosenTemplate ?? search.template ?? defaultResumeData.metadata.template;
	const [error, setError] = useState<string | null>(null);

	const createResume = useMutation(orpc.resume.create.mutationOptions());
	const updateResume = useMutation(orpc.resume.update.mutationOptions());

	const filteredTemplates = useMemo(() => {
		return templateGalleryOrder
			.map((template) => [template, templates[template]] as const)
			.filter(([, metadata]) => category === "All" || (metadata.tags as readonly string[]).includes(category));
	}, [category]);

	async function continueToBuilder() {
		setError(null);

		try {
			const id = await createResume.mutateAsync({
				name: t`My CV`,
				slug: slugify(`my-cv-${generateId()}`),
				tags: [],
			});
			const data = structuredClone(defaultResumeData);
			data.metadata.template = selectedTemplate;

			await updateResume.mutateAsync({ id, data });
			await navigate({
				to: "/builder/$resumeId",
				params: { resumeId: id },
				search: { step: "personal-details", mode: "create" },
			});
		} catch (cause) {
			setError(getResumeErrorMessage(cause));
		}
	}

	const isCreating = createResume.isPending || updateResume.isPending;

	return (
		<div className="flex h-svh flex-col overflow-hidden bg-bg">
			<div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-10">
				<div className="mx-auto max-w-7xl pb-8">
					<header>
						<Link to="/" className="font-display font-semibold text-primary text-xl tracking-tight">
							HeadCV
						</Link>
					</header>

					<main className="mt-10">
						<div className="mx-auto max-w-2xl text-center">
							<div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-primary/15 bg-primary/8 text-primary">
								<SlideshowIcon className="size-6" aria-hidden="true" />
							</div>
							<h1 className="mt-6 font-bold font-display text-3xl text-foreground tracking-tight sm:text-4xl">
								<Trans>Choose a template that fits your story</Trans>
							</h1>
							<p className="mt-3 text-muted-foreground">
								<Trans>Start with a recommended design. You can change it anytime without losing your content.</Trans>
							</p>
						</div>

						<div className="mx-auto mt-10 flex w-fit max-w-full flex-wrap justify-center gap-1.5 rounded-2xl border bg-background p-1.5 shadow-sm">
							{categoryOptions.map((option) => (
								<button
									key={option}
									type="button"
									onClick={() => setCategory(option)}
									className={cn(
										"rounded-xl border border-transparent px-4 py-2 text-muted-foreground text-sm transition-colors hover:bg-secondary hover:text-foreground",
										category === option && "border-primary/20 bg-primary/10 font-medium text-primary",
									)}
								>
									{option === "All" ? <Trans>All templates</Trans> : option}
								</button>
							))}
						</div>

						<div className="mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
							{filteredTemplates.map(([id, metadata]) => {
								const templateId = id as Template;
								const isSelected = selectedTemplate === templateId;

								return (
									<button
										key={id}
										type="button"
										onClick={() => setSelectedTemplate(templateId)}
										className={cn(
											"group rounded-3xl border border-border/80 bg-background p-3 text-start shadow-[0_2px_8px_rgba(30,58,95,0.015)] transition-[border-color,box-shadow] hover:border-primary/45 hover:shadow-[0_3px_10px_rgba(30,58,95,0.025)]",
											isSelected && "border-primary/60 ring-2 ring-primary/10",
										)}
										aria-pressed={isSelected}
									>
										<div className="relative aspect-[0.707] overflow-hidden rounded-2xl bg-white">
											<img
												src={
													templateId === "chikorita"
														? "/templates/chikorita-hero-vector.svg"
														: `/templates/gallery/${templateId}.jpg`
												}
												alt={metadata.name}
												width={2110}
												height={2982}
												loading="lazy"
												decoding="async"
												className="size-full rounded-lg border border-black/5 bg-white object-contain object-top"
											/>
											{isSelected && (
												<span className="absolute top-5 right-5 flex size-8 items-center justify-center rounded-full border border-primary/20 bg-white text-primary shadow-sm">
													<CheckIcon className="size-4" aria-hidden="true" />
												</span>
											)}
										</div>
										<div className="px-2 pt-4 pb-2">
											<div className="flex items-center justify-between gap-2">
												<h2 className="font-semibold text-foreground">{metadata.name}</h2>
												{isSelected && (
													<span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary text-xs">
														<Trans>Selected</Trans>
													</span>
												)}
											</div>
											<p className="mt-2 line-clamp-2 text-muted-foreground text-sm leading-relaxed">
												{i18n.t(metadata.description)}
											</p>
										</div>
									</button>
								);
							})}
						</div>

						{error && (
							<p role="alert" className="mt-6 text-center text-danger-dark text-sm">
								{error}
							</p>
						)}
					</main>
				</div>
			</div>

			<div className="shrink-0 border-border border-t bg-background/95 px-4 py-4 shadow-[0_-2px_8px_rgba(30,58,95,0.02)] backdrop-blur sm:px-8">
				<div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
					<div className="min-w-0 text-start">
						<p className="text-muted-foreground text-xs">
							<Trans>Selected template</Trans>
						</p>
						<p className="truncate font-semibold text-foreground">{templates[selectedTemplate as Template].name}</p>
					</div>
					<Button size="lg" onClick={() => void continueToBuilder()} disabled={isCreating}>
						{isCreating ? <Trans>Preparing your CV...</Trans> : <Trans>Start building</Trans>}
					</Button>
				</div>
			</div>
		</div>
	);
}
