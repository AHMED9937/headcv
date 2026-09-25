import type { ReactNode } from "react";
import type { LeftSidebarSection } from "@/libs/resume/section";
import { createContext, useContext } from "react";

type BuilderSectionNavigationContextValue = {
	navigateToSection?: (section: LeftSidebarSection) => void;
};

const BuilderSectionNavigationContext = createContext<BuilderSectionNavigationContextValue>({});

export function useBuilderSectionNavigation() {
	return useContext(BuilderSectionNavigationContext);
}

export function BuilderSectionNavigationProvider({
	children,
	navigateToSection,
}: {
	children: ReactNode;
	navigateToSection?: (section: LeftSidebarSection) => void;
}) {
	return (
		<BuilderSectionNavigationContext.Provider value={{ navigateToSection }}>
			{children}
		</BuilderSectionNavigationContext.Provider>
	);
}
