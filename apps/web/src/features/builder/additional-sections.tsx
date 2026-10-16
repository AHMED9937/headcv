import type { ResumeData, SectionType } from "@headcv/schema/resume/data";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "@headcv/ui/components/button";
import { useDialogStore } from "@/dialogs/store";
import { useCurrentResume, useUpdateResumeData } from "@/features/resume/builder/draft";
import { getSectionIcon, getSectionTitle } from "@/libs/resume/section";

const OPTIONAL_SECTIONS: SectionType[] = [
	"projects",
	"languages",
	"interests",
	"awards",
	"certifications",
	"publications",
	"volunteer",
	"references",
];

export function getAddedOptionalSections(data: ResumeData): SectionType[] {
	return OPTIONAL_SECTIONS.filter((type) => {
		const section = data.sections[type];
		return !section.hidden && section.items.length > 0;
	});
}

export function AdditionalSections() {
	const resume = useCurrentResume();
	const updateResumeData = useUpdateResumeData();
	const { openInlineDialog } = useDialogStore();

	const handleAdd = (type: SectionType | "custom") => {
		if (type === "custom") {
			openInlineDialog("resume.sections.custom.create", undefined);
			return;
		}

		// The section is un-hidden and placed on the layout when the first entry is saved.
		openInlineDialog(`resume.sections.${type}.create` as const, undefined);
	};

	const handleSkip = (type: SectionType | "custom") => {
		if (type === "custom") return;

		updateResumeData((draft) => {
			draft.sections[type].hidden = true;
		});
	};

	return (
		<div className="space-y-4 p-1">
			<p className="text-muted-foreground text-sm">
				<Trans>Add optional sections to your CV. You can always come back and edit them later.</Trans>
			</p>

			<div className="grid gap-3 sm:grid-cols-2">
				{OPTIONAL_SECTIONS.map((type) => {
					const section = resume.data.sections[type];
					const isHidden = section.hidden;
					const hasItems = section.items.length > 0;

					return (
						<div
							key={type}
							className={`flex flex-col justify-between gap-3 rounded-lg border p-3 ${isHidden ? "opacity-60" : ""}`}
						>
							<div className="flex items-center gap-2 font-medium">
								{getSectionIcon(type)}
								{getSectionTitle(type)}
								{isHidden && <span className="text-muted-foreground text-xs">({t`skipped`})</span>}
							</div>

							<div className="flex items-center gap-2">
								<Button size="sm" variant="outline" onClick={() => handleAdd(type)}>
									<PlusIcon className="size-3.5" />
									{hasItems && !isHidden ? t`Add another` : t`Add`}
								</Button>

								{!isHidden && !hasItems && (
									<Button size="sm" variant="ghost" onClick={() => handleSkip(type)}>
										{t`Skip`}
									</Button>
								)}
							</div>
						</div>
					);
				})}

				<div className="flex flex-col justify-between gap-3 rounded-lg border p-3">
					<div className="flex items-center gap-2 font-medium">
						{getSectionIcon("custom")}
						{getSectionTitle("custom")}
					</div>
					<Button size="sm" variant="outline" onClick={() => handleAdd("custom")}>
						<PlusIcon className="size-3.5" />
						{t`Add custom section`}
					</Button>
				</div>
			</div>
		</div>
	);
}
