import type { LeftSidebarSection } from "@/libs/resume/section";
import { Fragment, useCallback, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@headcv/ui/components/avatar";
import { Button } from "@headcv/ui/components/button";
import { ScrollArea } from "@headcv/ui/components/scroll-area";
import { Separator } from "@headcv/ui/components/separator";
import { getInitials } from "@headcv/utils/string";
import { cn } from "@headcv/utils/style";
import { BuilderStepActions } from "@/features/builder/step-actions";
import { getStepSectionId, useBuilderStep } from "@/features/builder/use-builder-step";
import { UserDropdownMenu } from "@/features/user/dropdown-menu";
import { getSectionIcon, getSectionTitle, leftSidebarSections } from "@/libs/resume/section";
import { BuilderSidebarEdge } from "../../-components/edge";
import { useSectionStore } from "../../-store/section";
import { useBuilderSidebar } from "../../-store/sidebar";
import { getSectionComponent } from "./section-components";

export function BuilderSidebarLeft({ guided = false }: { guided?: boolean }) {
	const scrollAreaRef = useRef<HTMLDivElement | null>(null);
	const { currentStep } = useBuilderStep();
	const setCollapsed = useSectionStore((state) => state.setCollapsed);
	const guidedSection = getStepSectionId(currentStep);
	const sections = guided
		? guidedSection
			? [guidedSection]
			: []
		: leftSidebarSections.filter((section) => section !== "ai-review");

	useEffect(() => {
		const sectionId = getStepSectionId(currentStep);
		if (!sectionId || !scrollAreaRef.current) return;

		setCollapsed(sectionId, false);

		const sectionElement = scrollAreaRef.current.querySelector(`#sidebar-${sectionId}`);
		sectionElement?.scrollIntoView({ block: "start", inline: "nearest", behavior: "smooth" });
	}, [currentStep, setCollapsed]);

	return (
		<>
			{!guided && <SidebarEdge scrollAreaRef={scrollAreaRef} />}

			<div className={cn("flex h-full flex-col bg-background", !guided && "sm:ms-12")}>
				<ScrollArea ref={scrollAreaRef} className="@container flex-1 bg-background">
					<div className="space-y-4 p-4">
						{sections.map((section) => (
							<Fragment key={section}>
								{getSectionComponent(section)}
								<Separator />
							</Fragment>
						))}
					</div>
				</ScrollArea>
				<BuilderStepActions />
			</div>
		</>
	);
}

type SidebarEdgeProps = {
	scrollAreaRef: React.RefObject<HTMLDivElement | null>;
};

function SidebarEdge({ scrollAreaRef }: SidebarEdgeProps) {
	const toggleSidebar = useBuilderSidebar((state) => state.toggleSidebar);

	const scrollToSection = useCallback(
		(section: LeftSidebarSection) => {
			if (!scrollAreaRef.current) return;
			toggleSidebar("left", true);

			const sectionElement = scrollAreaRef.current.querySelector(`#sidebar-${section}`);
			sectionElement?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
		},
		[toggleSidebar, scrollAreaRef],
	);

	return (
		<BuilderSidebarEdge side="left">
			<div className="flex min-h-0 w-full flex-1 flex-col items-center gap-y-2 overflow-hidden">
				<div className="no-scrollbar min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden">
					<div className="flex min-h-full flex-col items-center justify-center gap-y-2">
						{leftSidebarSections
							.filter((section) => section !== "ai-review")
							.map((section) => (
								<Button
									key={section}
									size="icon"
									variant="ghost"
									title={getSectionTitle(section)}
									onClick={() => scrollToSection(section)}
								>
									{getSectionIcon(section)}
								</Button>
							))}
					</div>
				</div>

				<UserDropdownMenu>
					{({ session }) => (
						<Button size="icon" variant="ghost">
							<Avatar className="size-6">
								<AvatarImage src={session.user.image ?? undefined} />
								<AvatarFallback className="text-[0.5rem]">{getInitials(session.user.name)}</AvatarFallback>
							</Avatar>
						</Button>
					)}
				</UserDropdownMenu>
			</div>
		</BuilderSidebarEdge>
	);
}
