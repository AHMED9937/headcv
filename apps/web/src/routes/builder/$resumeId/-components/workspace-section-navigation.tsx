import type { ReactNode } from "react";
import type { SidebarSection } from "@/libs/resume/section";
import { ScrollArea } from "@headcv/ui/components/scroll-area";
import { cn } from "@headcv/utils/style";
import { getSectionIcon, getSectionTitle } from "@/libs/resume/section";

type WorkspaceSectionNavigationProps<TSection extends SidebarSection> = {
	ariaLabel: string;
	description: ReactNode;
	icon: ReactNode;
	items: readonly TSection[];
	onChange: (section: TSection) => void;
	section: TSection;
	status?: ReactNode;
	title: ReactNode;
};

export function WorkspaceSectionNavigation<TSection extends SidebarSection>({
	ariaLabel,
	description,
	icon,
	items,
	onChange,
	section,
	status,
	title,
}: WorkspaceSectionNavigationProps<TSection>) {
	return (
		<nav className="hidden min-h-0 w-52 shrink-0 flex-col border-e bg-muted/20 lg:flex" aria-label={ariaLabel}>
			<div className="border-b px-4 py-4">
				<div className="flex items-center gap-2 text-primary">
					{icon}
					<span className="font-semibold text-sm">{title}</span>
				</div>
				<p className="mt-1 text-muted-foreground text-xs">{description}</p>
				{status && (
					<span className="mt-3 inline-flex rounded-full bg-primary/10 px-2 py-1 font-medium text-primary text-xs">
						{status}
					</span>
				)}
			</div>

			<ScrollArea className="min-h-0 flex-1">
				<div className="space-y-1 p-2">
					{items.map((item) => (
						<button
							key={item}
							type="button"
							onClick={() => onChange(item)}
							className={cn(
								"flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm transition-colors hover:bg-muted",
								section === item &&
									(item === "ai-review"
										? "bg-green-100 font-medium text-green-800 dark:bg-green-900/40 dark:text-green-100"
										: "bg-primary/10 font-medium text-primary"),
							)}
							aria-current={section === item ? "page" : undefined}
						>
							{getSectionIcon(item, { size: 16, "aria-hidden": true })}
							<span className="truncate">{getSectionTitle(item)}</span>
						</button>
					))}
				</div>
			</ScrollArea>
		</nav>
	);
}

type WorkspaceSectionSelectProps<TSection extends SidebarSection> = Pick<
	WorkspaceSectionNavigationProps<TSection>,
	"ariaLabel" | "items" | "onChange" | "section"
> & {
	label: ReactNode;
};

export function WorkspaceSectionSelect<TSection extends SidebarSection>({
	ariaLabel,
	items,
	label,
	onChange,
	section,
}: WorkspaceSectionSelectProps<TSection>) {
	return (
		<label className="block lg:hidden">
			<span className="mb-2 block font-semibold text-sm">{label}</span>
			<select
				aria-label={ariaLabel}
				value={section}
				onChange={(event) => {
					const nextSection = items.find((item) => item === event.currentTarget.value);
					if (nextSection) onChange(nextSection);
				}}
				className="h-12 w-full rounded-xl border bg-background px-4 text-base shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				{items.map((item) => (
					<option key={item} value={item}>
						{getSectionTitle(item)}
					</option>
				))}
			</select>
		</label>
	);
}
