// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { MonthInput } from "./month-input";

beforeEach(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

const renderMonthInput = (props: React.ComponentProps<typeof MonthInput> = {}) =>
	render(
		<I18nProvider i18n={i18n}>
			<MonthInput aria-label="Start date" {...props} />
		</I18nProvider>,
	);

describe("MonthInput", () => {
	it("opens the application month picker when the field is clicked", async () => {
		renderMonthInput();
		await userEvent.click(screen.getByLabelText("Start date"));
		expect(screen.getByRole("button", { name: "Jan" })).toBeInTheDocument();
	});

	it("returns a canonical YYYY-MM value when a month is selected", async () => {
		const onValueChange = vi.fn();
		renderMonthInput({ onValueChange });
		await userEvent.click(screen.getByLabelText("Start date"));
		await userEvent.click(screen.getByRole("button", { name: "Mar" }));
		expect(onValueChange).toHaveBeenCalledWith(`${new Date().getFullYear()}-03`);
	});

	it("shows and can clear the formatted selected month", async () => {
		const onValueChange = vi.fn();
		renderMonthInput({ value: "2021-12", onValueChange });
		expect(screen.getByLabelText("Start date")).toHaveValue("December 2021");
		await userEvent.click(screen.getByLabelText("Start date"));
		await userEvent.click(screen.getByRole("button", { name: "Clear date" }));
		expect(onValueChange).toHaveBeenCalledWith("");
	});

	it("does not open the picker when the field is disabled", async () => {
		renderMonthInput({ disabled: true });
		await userEvent.click(screen.getByLabelText("Start date"));
		expect(screen.queryByRole("button", { name: "Jan" })).not.toBeInTheDocument();
	});
});
