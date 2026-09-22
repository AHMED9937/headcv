import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { GridFourIcon, ListIcon, ReadCvLogoIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, stripSearchParams, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import z from "zod";
import { Tabs, TabsList, TabsTrigger } from "@headcv/ui/components/tabs";
import { cn } from "@headcv/utils/style";
import { Combobox } from "@/components/ui/combobox";
import { orpc } from "@/libs/orpc/client";
import { GridView } from "./-components/grid-view";
import { ListView } from "./-components/list-view";

type SortOption = "lastUpdatedAt" | "createdAt" | "name";

const searchSchema = z.object({
	tags: z.array(z.string()).default([]),
	sort: z.enum(["lastUpdatedAt", "createdAt", "name"]).default("lastUpdatedAt"),
	view: z.enum(["grid", "list"]).default("grid"),
});

type Search = z.output<typeof searchSchema>;

const defaultSearch: Search = { tags: [], sort: "lastUpdatedAt", view: "grid" };

export const Route = createFileRoute("/dashboard/resumes/")({
	component: RouteComponent,
	validateSearch: searchSchema,
	search: {
		middlewares: [stripSearchParams(defaultSearch)],
	},
});

function RouteComponent() {
	const { i18n } = useLingui();
	const { tags, sort, view } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });

	const { data: allTags } = useQuery(orpc.resume.tags.list.queryOptions());
	const { data: resumes } = useQuery(orpc.resume.list.queryOptions({ input: { tags, sort } }));

	const tagOptions = useMemo(() => {
		if (!allTags) return [];
		return allTags.map((tag) => ({ value: tag, label: tag }));
	}, [allTags]);

	const sortOptions = useMemo(() => {
		return [
			{ value: "lastUpdatedAt", label: i18n.t("Last Updated") },
			{ value: "createdAt", label: i18n.t("Created") },
			{ value: "name", label: i18n.t("Name") },
		];
	}, [i18n]);

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-2 shadow-sm">
				<div className="flex items-center gap-2.5 px-2">
					<ReadCvLogoIcon className="size-6" />
					<span className="font-semibold text-lg">
						<Trans>Resumes</Trans>
					</span>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Combobox
						value={sort}
						options={sortOptions}
						placeholder={t`Sort`}
						onValueChange={(value) => {
							if (!value) return;
							void navigate({ search: (prev: Search) => ({ ...prev, sort: value as SortOption }) });
						}}
					/>

					<div className={cn("flex", { hidden: tagOptions.length === 0 })}>
						<Combobox
							multiple
							value={tags}
							options={tagOptions}
							placeholder={t`Filter`}
							onValueChange={(value) => {
								void navigate({ search: (prev: Search) => ({ ...prev, tags: value ?? [] }) });
							}}
						/>
					</div>

					<Tabs value={view}>
						<TabsList>
							<TabsTrigger
								value="grid"
								nativeButton={false}
								className="rounded-e-none"
								render={<Link to="." search={(prev: Search) => ({ ...prev, view: "grid" })} />}
							>
								<GridFourIcon />
							</TabsTrigger>

							<TabsTrigger
								value="list"
								nativeButton={false}
								className="rounded-s-none"
								render={<Link to="." search={(prev: Search) => ({ ...prev, view: "list" })} />}
							>
								<ListIcon />
							</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>
			</div>

			{view === "list" ? <ListView resumes={resumes ?? []} /> : <GridView resumes={resumes ?? []} />}
		</div>
	);
}
