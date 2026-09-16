// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { PromptDialogProvider } from "@/hooks/use-prompt";

const onChange = vi.fn();

const { SummaryBuilder } = await import("./summary-builder");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

describe("SummaryBuilder", () => {
	it("renders formula choices", () => {
		render(
			<I18nProvider i18n={i18n}>
				<PromptDialogProvider>
					<SummaryBuilder value="" onChange={onChange} />
				</PromptDialogProvider>
			</I18nProvider>,
		);

		expect(screen.getByText(/Choose a formula/i)).toBeInTheDocument();
	});

	it("assembles a formula from filled-in facts", async () => {
		render(
			<I18nProvider i18n={i18n}>
				<PromptDialogProvider>
					<SummaryBuilder value="" onChange={onChange} />
				</PromptDialogProvider>
			</I18nProvider>,
		);

		const formulaButton = screen.getAllByRole("button")[0];
		expect(formulaButton).toBeTruthy();
		if (!formulaButton) throw new Error("Formula button not found");
		await userEvent.click(formulaButton);

		const inputs = screen.getAllByRole("textbox");
		for (const input of inputs) {
			await userEvent.type(input, "test");
		}

		const applyButton = screen.getByRole("button", { name: /Apply to summary/i });
		expect(applyButton).toBeEnabled();
	});
});
