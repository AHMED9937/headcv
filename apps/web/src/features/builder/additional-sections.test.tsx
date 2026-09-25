// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { defaultResumeData } from "@headcv/schema/resume/default";
import { useDialogStore } from "@/dialogs/store";
import { AdditionalSections } from "./additional-sections";

const updateResumeData = vi.fn();

vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => ({ data: structuredClone(defaultResumeData) }),
	useUpdateResumeData: () => updateResumeData,
}));

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

beforeEach(() => {
	useDialogStore.setState({ open: false, activeDialog: null, onBeforeClose: null, presentation: "modal" });
	updateResumeData.mockClear();
});

describe("AdditionalSections", () => {
	it("opens custom-section creation in the shared inline editor", () => {
		render(
			<I18nProvider i18n={i18n}>
				<AdditionalSections />
			</I18nProvider>,
		);

		fireEvent.click(screen.getByRole("button", { name: /Add custom section/i }));

		expect(useDialogStore.getState()).toMatchObject({
			open: false,
			presentation: "inline",
			activeDialog: { type: "resume.sections.custom.create" },
		});
	});

	it("opens built-in section creation inline too", () => {
		render(
			<I18nProvider i18n={i18n}>
				<AdditionalSections />
			</I18nProvider>,
		);

		const addButtons = screen.getAllByRole("button", { name: /^Add$/i });
		fireEvent.click(addButtons[0] as HTMLElement);

		expect(useDialogStore.getState()).toMatchObject({
			open: false,
			presentation: "inline",
			activeDialog: { type: "resume.sections.projects.create" },
		});
	});
});
