import type { ResumeData } from "@headcv/schema/resume/data";
import type { ReactNode } from "react";
import type { SectionTitleResolver } from "./section-title";
import { createContext, use } from "react";
import { isRTL } from "@headcv/utils/locale";

type RenderContextValue = ResumeData & {
	resolveSectionTitle?: SectionTitleResolver | undefined;
	sectionMarkerPrefix?: string | undefined;
	rtl: boolean;
};

const RenderContext = createContext<RenderContextValue | null>(null);

export type RenderProviderProps = {
	data: ResumeData;
	resolveSectionTitle?: SectionTitleResolver | undefined;
	sectionMarkerPrefix?: string | undefined;
	children: ReactNode;
};

export const RenderProvider = ({ data, resolveSectionTitle, sectionMarkerPrefix, children }: RenderProviderProps) => {
	const rtl = isRTL(data.metadata.page.locale);

	return (
		<RenderContext.Provider value={{ ...data, resolveSectionTitle, sectionMarkerPrefix, rtl }}>
			{children}
		</RenderContext.Provider>
	);
};

export const useRender = (): RenderContextValue => {
	const context = use(RenderContext);

	if (!context) throw new Error("useRender must be called inside a <RenderProvider>.");

	return context;
};
