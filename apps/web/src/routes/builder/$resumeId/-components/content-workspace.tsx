import type { LeftSidebarSection } from "@/libs/resume/section";
import { useEffect, useMemo, useRef } from "react";
import { useDialogStore } from "@/dialogs/store";
import { useAiAssistant } from "@/features/resume/builder/ai-assistant";
import { AiFabClearance } from "@/features/resume/builder/ai-fab-clearance";
import { useCurrentResume } from "@/features/resume/builder/draft";
import { getLayoutOrderedLeftSidebarSections } from "@/libs/resume/section";
import { getSectionComponent } from "../-sidebar/left/section-components";
import { CustomSectionBuilder } from "../-sidebar/left/sections/custom";
import { PersonalDetailsSectionBuilder } from "../-sidebar/left/sections/personal-details";
import { isVisibleEditorSection } from "../-sidebar/right/sections/layout/visibility";
import { useSectionStore } from "../-store/section";
import { InlineSectionEditor } from "./inline-section-editor";
import { BuilderSectionNavigationProvider } from "./section-navigation-context";

const PERSONAL_DETAILS_SECTIONS: readonly LeftSidebarSection[] = ["picture", "basics"];

function useVisibleContentSections(): LeftSidebarSection[] {
	const resume = useCurrentResume();
	const { hasReviewableChanges } = useAiAssistant();

	return useMemo(() => {
		const visible = getLayoutOrderedLeftSidebarSections(resume.data).filter((type) => {
			if (PERSONAL_DETAILS_SECTIONS.includes(type)) return false;
			if (type === "custom") return true;
			if (type === "ai-review") return false;
			return isVisibleEditorSection(type, resume.data);
		});

		if (hasReviewableChanges) visible.push("ai-review");
		return visible;
	}, [resume.data, hasReviewableChanges]);
}

type ContentWorkspacePanelProps = {
	section: LeftSidebarSection;
	onSectionChange: (section: LeftSidebarSection) => void;
};

export function ContentWorkspacePanel({ section, onSectionChange }: ContentWorkspacePanelProps) {
	const scrollRef = useRef<HTMLDivElement | null>(null);
	const expandLeftSection = useSectionStore((state) => state.expandLeftSection);
	const visibleSections = useVisibleContentSections();
	const showingInlineEditor = useDialogStore(
		(state) =>
			state.presentation === "inline" &&
			/^resume\.sections\.[^.]+\.(create|update)$/.test(state.activeDialog?.type ?? ""),
	);

	const activeSection = PERSONAL_DETAILS_SECTIONS.includes(section)
		? "basics"
		: visibleSections.includes(section)
			? section
			: (visibleSections[0] ?? "summary");

	useEffect(() => {
		if (!activeSection || !scrollRef.current) return;

		expandLeftSection(activeSection);
		const target = scrollRef.current.querySelector(`#sidebar-${activeSection}`);
		target?.scrollIntoView({ behavior: "smooth", block: "start" });
	}, [activeSection, expandLeftSection]);

	const showAiReview = visibleSections.includes("ai-review");
	const contentSections = visibleSections.filter((type) => type !== "ai-review");

	return (
		<div className="flex h-full min-h-0 flex-col bg-background">
			<div
				ref={scrollRef}
				className="builder-sections-scroll @container min-h-0 flex-1 overflow-y-auto overscroll-contain"
			>
				<BuilderSectionNavigationProvider navigateToSection={onSectionChange}>
					<div className="space-y-4 p-4 sm:p-6">
						{showingInlineEditor ? (
							<InlineSectionEditor />
						) : (
							<>
								{showAiReview && getSectionComponent("ai-review")}

								<PersonalDetailsSectionBuilder />

								{contentSections.map((type) =>
									type === "custom" ? (
										<CustomSectionBuilder key={type} showAdditionalSections />
									) : (
										<div key={type}>{getSectionComponent(type)}</div>
									),
								)}
							</>
						)}
						<AiFabClearance />
					</div>
				</BuilderSectionNavigationProvider>
			</div>
		</div>
	);
}
