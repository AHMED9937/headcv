// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

vi.mock("@/features/resume/builder/draft", async () => {
	const { defaultResumeData } = await import("@headcv/schema/resume/default");
	const data = structuredClone(defaultResumeData);
	data.customSections = [
		{
			id: "custom-1",
			title: "Open Source Work",
			type: "projects",
			columns: 1,
			hidden: false,
			items: [],
		},
	];

	return { useCurrentResume: () => ({ data }), useUpdateResumeData: () => vi.fn() };
});
vi.mock("@/features/builder/use-builder-step", () => ({
	useBuilderStep: () => ({ currentStep: "additional-sections" }),
}));
vi.mock("@/hooks/use-confirm", () => ({ useConfirm: () => vi.fn() }));
vi.mock("@/features/builder/additional-sections", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/features/builder/additional-sections")>()),
	AdditionalSections: () => null,
}));
vi.mock("../shared/section-base", () => ({
	SectionBase: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("../shared/section-item", () => ({
	SectionAddItemButton: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
	SectionItem: ({ title }: { title: string }) => <div>{title}</div>,
}));

const { CustomSectionBuilder } = await import("./custom");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

const wrap = (ui: React.ReactNode) => <I18nProvider i18n={i18n}>{ui}</I18nProvider>;

describe("CustomSectionBuilder on the Additional Sections step", () => {
	it("continues to render user-created custom sections", () => {
		render(wrap(<CustomSectionBuilder />));

		expect(screen.getByText("Open Source Work")).toBeInTheDocument();
	});
});
