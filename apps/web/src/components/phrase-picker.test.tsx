// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

const onInsert = vi.fn();

const { PhrasePicker } = await import("./phrase-picker");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

describe("PhrasePicker", () => {
	it("opens a dialog and filters phrases by search", async () => {
		render(
			<I18nProvider i18n={i18n}>
				<PhrasePicker onInsert={onInsert} />
			</I18nProvider>,
		);

		await userEvent.click(screen.getByRole("button", { name: /Insert phrase/i }));
		expect(screen.getByRole("dialog")).toBeInTheDocument();

		const searchInput = screen.getByPlaceholderText(/Search phrases/i);
		await userEvent.type(searchInput, "Collaborated");

		const options = screen.getAllByRole("button").filter((button) => button.textContent?.includes("Collaborated with"));
		expect(options.length).toBeGreaterThan(0);
	});

	it("blocks insert when placeholders are unresolved", async () => {
		render(
			<I18nProvider i18n={i18n}>
				<PhrasePicker jobTitleId="software-engineer" onInsert={onInsert} />
			</I18nProvider>,
		);

		await userEvent.click(screen.getByRole("button", { name: /Insert phrase/i }));
		const patternButton = screen.getAllByRole("button").find((button) => button.textContent?.includes("["));
		expect(patternButton).toBeTruthy();
		if (!patternButton) throw new Error("Pattern button not found");
		await userEvent.click(patternButton);

		const insertButton = screen.getByRole("button", { name: /Insert into description/i });
		expect(insertButton).toBeDisabled();
	});
});
