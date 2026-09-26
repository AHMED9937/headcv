import type { ReactNode } from "react";
import type { DesignWorkspaceSection } from "@/libs/resume/section";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { PaletteIcon } from "@phosphor-icons/react";
import { Fragment, useEffect, useRef } from "react";
import { designWorkspaceSections } from "@/libs/resume/section";
import { getSectionComponent } from "../-sidebar/right/section-components";
import { StaticSectionsProvider } from "../-sidebar/right/shared/section-base";
import { useScrollSpy } from "./use-scroll-spy";
import { WorkspaceSectionNavigation, WorkspaceSectionSelect } from "./workspace-section-navigation";

type DesignWorkspacePanelProps = {
	section: DesignWorkspaceSection;
	onSectionChange: (section: DesignWorkspaceSection) => void;
	status?: ReactNode;
};

export function DesignWorkspacePanel({ section, onSectionChange, status }: DesignWorkspacePanelProps) {
	const scrollRef = useRef<HTMLDivElement | null>(null);
	const { active, scrollTo } = useScrollSpy(scrollRef, designWorkspaceSections, section);

	useEffect(() => {
		scrollTo(section);
	}, [section, scrollTo]);

	// The URL stays the source of truth for deep links; re-selecting the current section just scrolls back to it.
	const goTo = (next: DesignWorkspaceSection) => {
		if (next === section) scrollTo(next);
		else onSectionChange(next);
	};

	return (
		<div className="flex min-h-0 flex-1">
			<WorkspaceSectionNavigation
				ariaLabel={t`Design your resume`}
				description={<Trans>Select a section to edit</Trans>}
				icon={<PaletteIcon className="size-4" aria-hidden="true" />}
				items={designWorkspaceSections}
				onChange={goTo}
				section={active}
				status={status}
				title={<Trans>Design your resume</Trans>}
			/>

			<div
				ref={scrollRef}
				className="builder-sections-scroll @container min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain"
			>
				<div className="space-y-4 p-4 sm:p-6">
					<WorkspaceSectionSelect
						ariaLabel={t`Design your resume`}
						items={designWorkspaceSections}
						label={<Trans>Section</Trans>}
						onChange={goTo}
						section={active}
					/>

					<StaticSectionsProvider value>
						{designWorkspaceSections.map((type) => (
							<Fragment key={type}>{getSectionComponent(type)}</Fragment>
						))}
					</StaticSectionsProvider>
				</div>
			</div>
		</div>
	);
}
