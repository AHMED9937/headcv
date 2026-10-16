// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { defaultResumeData } from "@headcv/schema/resume/default";
import { useDialogStore } from "@/dialogs/store";
import { AdditionalSections, getAddedOptionalSections } from "./additional-sections";

const updateResumeData = vi.fn();
const state = vi.hoisted(() => ({ data: null as unknown }));

vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => ({ data: state.data }),
	useUpdateResumeData: () => updateResumeData,
}));

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

beforeEach(() => {
	useDialogStore.setState({ open: false, activeDialog: null, onBeforeClose: null, presentation: "modal" });
	updateResumeData.mockClear();
	state.data = structuredClone(defaultResumeData);
});

describe("AdditionalSections", () => {
	it("derives added optional sections from visible entries", () => {
		const data = structuredClone(defaultResumeData);
		data.sections.projects.hidden = false;
		data.sections.projects.items = [{ id: "p1", name: "HeadCV Builder" } as never];
		data.sections.languages.hidden = true;
		data.sections.languages.items = [{ id: "l1", language: "Arabic" } as never];

		expect(getAddedOptionalSections(data)).toEqual(["projects"]);
	});

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

	it("keeps Add usable once a section has entries, so more can be added", () => {
		const data = state.data as typeof defaultResumeData;
		data.sections.projects.items = [{ id: "p1", name: "HeadCV Builder" } as never];

		render(
			<I18nProvider i18n={i18n}>
				<AdditionalSections />
			</I18nProvider>,
		);

		const addAnother = screen.getByRole("button", { name: /Add another/i });
		expect(addAnother).toBeEnabled();
		fireEvent.click(addAnother);

		expect(useDialogStore.getState()).toMatchObject({
			presentation: "inline",
			activeDialog: { type: "resume.sections.projects.create" },
		});
	});
});
