import type { Basics, Picture } from "@headcv/schema/resume/data";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
	ArrowLeftIcon,
	EnvelopeSimpleIcon,
	LightbulbIcon,
	MapPinIcon,
	PencilSimpleIcon,
	PhoneIcon,
	UserIcon,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Button } from "@headcv/ui/components/button";
import { SectionTips } from "@/components/section-tips";
import { useCurrentResume, useUpdateResumeData } from "@/features/resume/builder/draft";
import { requestResumePreviewSection } from "@/features/resume/preview/preview-navigation";
import {
	useClearInlineEditPreviewOverride,
	useSetInlineEditPreviewOverride,
} from "@/libs/inline-edit-preview-override";
import { useBuilderSectionNavigation } from "../../../-components/section-navigation-context";
import { BasicsSectionForm } from "./basics";
import { PictureSectionForm } from "./picture";

type PersonalDetailsDraft = { basics: Basics; picture: Picture };

export function PersonalDetailsSectionBuilder() {
	const resume = useCurrentResume();
	const updateResumeData = useUpdateResumeData();
	const setPreviewOverride = useSetInlineEditPreviewOverride();
	const clearPreviewOverride = useClearInlineEditPreviewOverride();
	const { navigateToSection } = useBuilderSectionNavigation();
	const [draft, setDraft] = useState<PersonalDetailsDraft | null>(null);
	const [showTips, setShowTips] = useState(false);

	useEffect(() => clearPreviewOverride, [clearPreviewOverride]);

	const navigateToPreview = () => {
		requestResumePreviewSection("basics");
		navigateToSection?.("basics");
	};

	const openEditor = () => {
		const next = { basics: structuredClone(resume.data.basics), picture: structuredClone(resume.data.picture) };
		setDraft(next);
		setShowTips(false);
		navigateToPreview();
	};

	const updateDraft = (next: PersonalDetailsDraft) => {
		setDraft(next);
		setPreviewOverride({ kind: "personal-details", ...next });
	};

	const closeEditor = () => {
		clearPreviewOverride();
		setDraft(null);
		setShowTips(false);
	};

	const save = () => {
		if (!draft) return;
		updateResumeData((data) => {
			data.basics = draft.basics;
			data.picture = draft.picture;
		});
		closeEditor();
	};

	if (draft) {
		return (
			<div id="sidebar-basics" className="space-y-5 rounded-2xl border bg-background p-5 shadow-sm">
				<div className="flex items-center justify-between gap-3">
					<Button variant="ghost" size="sm" onClick={closeEditor}>
						<ArrowLeftIcon aria-hidden="true" />
						<Trans>Back</Trans>
					</Button>
					<Button variant="ghost" size="sm" onClick={() => setShowTips((open) => !open)}>
						<LightbulbIcon aria-hidden="true" />
						<Trans>Get Tips</Trans>
					</Button>
				</div>
				<h2 className="font-semibold text-xl tracking-tight">
					<Trans>Edit Personal Details</Trans>
				</h2>
				{showTips && <SectionTips type="basics" />}
				<div className="grid @lg:grid-cols-[minmax(0,1fr)_minmax(15rem,0.65fr)] grid-cols-1 gap-6">
					<BasicsSectionForm value={draft.basics} onChange={(basics) => updateDraft({ ...draft, basics })} />
					<PictureSectionForm
						value={draft.picture}
						onChange={(picture) => updateDraft({ ...draft, picture })}
						advancedCollapsible
					/>
				</div>
				<Button className="w-full" onClick={save}>
					<Trans>Done</Trans>
				</Button>
			</div>
		);
	}

	const { basics, picture } = resume.data;
	const pictureUrl = picture.url.startsWith("/uploads/") ? `/api${picture.url}` : picture.url;

	return (
		<section id="sidebar-basics" className="rounded-2xl border bg-background p-5 shadow-sm">
			<div className="mb-4 flex items-start justify-between gap-3">
				<div className="flex min-w-0 items-center gap-3">
					<span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
						<UserIcon className="size-5" aria-hidden="true" />
					</span>
					<div className="min-w-0">
						<h2 className="truncate font-semibold text-lg">{basics.name || t`Personal Details`}</h2>
						{basics.headline && <p className="truncate text-muted-foreground text-sm">{basics.headline}</p>}
					</div>
				</div>
				<Button size="icon" aria-label={t`Edit Personal Details`} onClick={openEditor}>
					<PencilSimpleIcon aria-hidden="true" />
				</Button>
			</div>
			<div className="grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-4">
				<div className="space-y-2 text-sm">
					{basics.email && <ContactLine icon={<EnvelopeSimpleIcon />} value={basics.email} />}
					{basics.phone && <ContactLine icon={<PhoneIcon />} value={basics.phone} />}
					{basics.location && <ContactLine icon={<MapPinIcon />} value={basics.location} />}
				</div>
				<div className="flex size-18 items-center justify-center overflow-hidden rounded-full bg-secondary">
					{pictureUrl && !picture.hidden ? (
						<img src={pictureUrl} alt="" className="size-full object-cover" />
					) : (
						<UserIcon className="size-7 text-muted-foreground" aria-hidden="true" />
					)}
				</div>
			</div>
		</section>
	);
}

function ContactLine({ icon, value }: { icon: React.ReactNode; value: string }) {
	return (
		<div className="flex min-w-0 items-center gap-2">
			<span className="shrink-0 text-primary">{icon}</span>
			<span className="truncate">{value}</span>
		</div>
	);
}
