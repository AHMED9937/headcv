import type { SectionType } from "@headcv/schema/resume/data";
import type { IconProps } from "@phosphor-icons/react";
import { t } from "@lingui/core/macro";
import {
	ArticleIcon,
	BooksIcon,
	BriefcaseIcon,
	CertificateIcon,
	ChartLineIcon,
	CodeSimpleIcon,
	CompassToolIcon,
	DiamondsFourIcon,
	DownloadIcon,
	EnvelopeSimpleIcon,
	FootballIcon,
	GraduationCapIcon,
	HandHeartIcon,
	ImageIcon,
	InfoIcon,
	LayoutIcon,
	MessengerLogoIcon,
	NotepadIcon,
	PaletteIcon,
	PhoneIcon,
	ReadCvLogoIcon,
	ShareFatIcon,
	SparkleIcon,
	StarIcon,
	TextTIcon,
	TranslateIcon,
	TrophyIcon,
	UserIcon,
} from "@phosphor-icons/react";
import { match } from "ts-pattern";
import { cn } from "@headcv/utils/style";

export type LeftSidebarSection = "picture" | "basics" | "summary" | SectionType | "custom" | "ai-review";

// CustomSectionType values that are not in SectionType (used in custom sections only)
type CustomOnlyType = "cover-letter";

export type RightSidebarSection =
	| "template"
	| "layout"
	| "typography"
	| "design"
	| "page"
	| "notes"
	| "sharing"
	| "statistics"
	| "analysis"
	| "export"
	| "information";

export type SidebarSection = LeftSidebarSection | RightSidebarSection;

export const leftSidebarSections = [
	"picture",
	"basics",
	"summary",
	"profiles",
	"experience",
	"education",
	"projects",
	"skills",
	"languages",
	"interests",
	"awards",
	"certifications",
	"publications",
	"volunteer",
	"references",
	"custom",
	"ai-review",
] as const satisfies readonly LeftSidebarSection[];

export const rightSidebarSections = [
	"template",
	"layout",
	"typography",
	"design",
	"page",
	"notes",
	"sharing",
	"statistics",
	"analysis",
	"export",
	"information",
] as const satisfies readonly RightSidebarSection[];

export const designWorkspaceSections = [
	"template",
	"design",
	"typography",
	"layout",
	"page",
	"notes",
] as const satisfies readonly RightSidebarSection[];

export type DesignWorkspaceSection = (typeof designWorkspaceSections)[number];

export const getSectionTitle = (type: SidebarSection | CustomOnlyType): string => {
	return (
		match(type)
			// Left Sidebar Sections
			.with("picture", () => t`Picture`)
			.with("basics", () => t`Basics`)
			.with("summary", () => t`Summary`)
			.with("profiles", () => t`Profiles`)
			.with("experience", () => t`Experience`)
			.with("education", () => t`Education`)
			.with("projects", () => t`Projects`)
			.with("skills", () => t`Skills`)
			.with("languages", () => t`Languages`)
			.with("interests", () => t`Interests`)
			.with("awards", () => t`Awards`)
			.with("certifications", () => t`Certifications`)
			.with("publications", () => t`Publications`)
			.with("volunteer", () => t`Volunteer`)
			.with("references", () => t`References`)
			.with("custom", () => t`Custom Sections`)
			.with("ai-review", () => t`AI Review`)

			// Custom Section Types (not in main sidebar)
			.with("cover-letter", () => t`Cover Letter`)

			// Right Sidebar Sections
			.with("template", () => t`Template`)
			.with("layout", () => t`Layout`)
			.with("typography", () => t`Typography`)
			.with("design", () => t`Design`)
			.with("page", () => t`Page`)
			.with("notes", () => t`Notes`)
			.with("sharing", () => t`Sharing`)
			.with("statistics", () => t`Statistics`)
			.with("analysis", () => t`Analysis`)
			.with("export", () => t`Export`)
			.with("information", () => t`Information`)

			.exhaustive()
	);
};

export const getSectionIcon = (type: SidebarSection | CustomOnlyType, props?: IconProps): React.ReactNode => {
	const iconProps = { ...props, className: cn("shrink-0", props?.className) };

	return (
		match(type)
			// Left Sidebar Sections
			.with("picture", () => <ImageIcon {...iconProps} />)
			.with("basics", () => <UserIcon {...iconProps} />)
			.with("summary", () => <ArticleIcon {...iconProps} />)
			.with("profiles", () => <MessengerLogoIcon {...iconProps} />)
			.with("experience", () => <BriefcaseIcon {...iconProps} />)
			.with("education", () => <GraduationCapIcon {...iconProps} />)
			.with("projects", () => <CodeSimpleIcon {...iconProps} />)
			.with("skills", () => <CompassToolIcon {...iconProps} />)
			.with("languages", () => <TranslateIcon {...iconProps} />)
			.with("interests", () => <FootballIcon {...iconProps} />)
			.with("awards", () => <TrophyIcon {...iconProps} />)
			.with("certifications", () => <CertificateIcon {...iconProps} />)
			.with("publications", () => <BooksIcon {...iconProps} />)
			.with("volunteer", () => <HandHeartIcon {...iconProps} />)
			.with("references", () => <PhoneIcon {...iconProps} />)
			.with("custom", () => <StarIcon {...iconProps} />)
			.with("ai-review", () => <SparkleIcon {...iconProps} />)

			// Custom Section Types (not in main sidebar)
			.with("cover-letter", () => <EnvelopeSimpleIcon {...iconProps} />)

			// Right Sidebar Sections
			.with("template", () => <DiamondsFourIcon {...iconProps} />)
			.with("layout", () => <LayoutIcon {...iconProps} />)
			.with("typography", () => <TextTIcon {...iconProps} />)
			.with("design", () => <PaletteIcon {...iconProps} />)
			.with("page", () => <ReadCvLogoIcon {...iconProps} />)
			.with("notes", () => <NotepadIcon {...iconProps} />)
			.with("sharing", () => <ShareFatIcon {...iconProps} />)
			.with("statistics", () => <ChartLineIcon {...iconProps} />)
			.with("analysis", () => <SparkleIcon {...iconProps} />)
			.with("export", () => <DownloadIcon {...iconProps} />)
			.with("information", () => <InfoIcon {...iconProps} />)

			.exhaustive()
	);
};
