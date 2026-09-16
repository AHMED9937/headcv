// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

const updateResumeData = vi.fn();

vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => ({
		data: { sections: { skills: { items: [] } } },
	}),
	useUpdateResumeData: () => updateResumeData,
}));

const { SkillSuggestions } = await import("./skill-suggestions");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

describe("SkillSuggestions", () => {
	it("renders job-title-filtered skill suggestions", () => {
		render(
			<I18nProvider i18n={i18n}>
				<SkillSuggestions jobTitleId="software-engineer" />
			</I18nProvider>,
		);

		expect(screen.getByText(/Suggested skills for this role/i)).toBeInTheDocument();
	});

	it("adds selected skills into the resume", async () => {
		render(
			<I18nProvider i18n={i18n}>
				<SkillSuggestions jobTitleId="software-engineer" />
			</I18nProvider>,
		);

		const checkbox = screen.getAllByRole("checkbox")[0];
		expect(checkbox).toBeTruthy();
		if (!checkbox) throw new Error("Checkbox not found");
		await userEvent.click(checkbox);
		await userEvent.click(screen.getByRole("button", { name: /Add selected/i }));

		expect(updateResumeData).toHaveBeenCalled();
	});
});
