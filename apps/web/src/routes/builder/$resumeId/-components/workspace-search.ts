import { z } from "zod";
import { designWorkspaceSections, leftSidebarSections } from "@/libs/resume/section";

export const workspaceTabs = ["content", "design", "review", "export"] as const;

export type WorkspaceTab = (typeof workspaceTabs)[number];

export const DEFAULT_CONTENT_SECTION = "basics" as const;
export const DEFAULT_DESIGN_SECTION = "template" as const;

export const builderSearchSchema = z.object({
	step: z.string().optional(),
	mode: z.enum(["create", "import", "edit"]).optional(),
	tab: z.enum(workspaceTabs).optional(),
	section: z.enum(leftSidebarSections).catch(DEFAULT_CONTENT_SECTION).optional(),
	designSection: z.enum(designWorkspaceSections).catch(DEFAULT_DESIGN_SECTION).optional(),
	reviewSection: z.string().optional(),
});

export type BuilderSearch = z.output<typeof builderSearchSchema>;
