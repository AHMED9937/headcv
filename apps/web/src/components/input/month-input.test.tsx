// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { MonthInput } from "./month-input";

const showPicker = vi.fn();

beforeEach(() => {
	showPicker.mockReset();
	Object.defineProperty(HTMLInputElement.prototype, "showPicker", {
		configurable: true,
		value: showPicker,
	});
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

const renderMonthInput = (props: React.ComponentProps<typeof MonthInput> = {}) =>
	render(
		<I18nProvider i18n={i18n}>
			<MonthInput aria-label="Start date" {...props} />
		</I18nProvider>,
	);

describe("MonthInput", () => {
	it("opens the month picker when the field is clicked", async () => {
		renderMonthInput();
		await userEvent.click(screen.getByLabelText("Start date"));
		expect(showPicker).toHaveBeenCalledTimes(1);
	});

	it("opens the month picker when the calendar button is clicked", async () => {
		renderMonthInput();
		await userEvent.click(screen.getByRole("button", { name: "Choose month" }));
		expect(showPicker).toHaveBeenCalledTimes(1);
	});

	it("does not open the picker when the field is disabled", async () => {
		renderMonthInput({ disabled: true });
		await userEvent.click(screen.getByLabelText("Start date"));
		expect(showPicker).not.toHaveBeenCalled();
	});
});
