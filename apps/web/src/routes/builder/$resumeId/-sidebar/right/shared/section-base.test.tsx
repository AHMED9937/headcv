// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

const sectionState = { collapsed: true };

vi.mock("../../../-store/section", () => ({
	useSectionStore: (
		selector: (state: { sections: Record<string, { collapsed: boolean }>; toggleCollapsed: () => void }) => unknown,
	) => selector({ sections: { typography: { collapsed: sectionState.collapsed } }, toggleCollapsed: vi.fn() }),
}));

const { SectionBase, StaticSectionsProvider } = await import("./section-base");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

describe("SectionBase", () => {
	it("renders as an always-open card without a collapse toggle inside StaticSectionsProvider", () => {
		render(
			<I18nProvider i18n={i18n}>
				<StaticSectionsProvider value>
					<SectionBase type="typography">
						<p>Typography controls</p>
					</SectionBase>
				</StaticSectionsProvider>
			</I18nProvider>,
		);

		// Content shows even though the persisted store says this section is collapsed.
		expect(screen.getByRole("region", { name: "Typography" })).toBeInTheDocument();
		expect(screen.getByText("Typography controls")).toBeInTheDocument();
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});

	it("keeps the collapsible accordion by default", () => {
		render(
			<I18nProvider i18n={i18n}>
				<SectionBase type="typography">
					<p>Typography controls</p>
				</SectionBase>
			</I18nProvider>,
		);

		expect(screen.getByRole("heading", { name: "Typography" })).toBeInTheDocument();
		expect(screen.getByRole("button")).toBeInTheDocument();
	});
});
