// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { MobileViewSwitch } from "./mobile-view-switch";

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

const renderSwitch = (value: "editor" | "preview", onChange = vi.fn()) => {
	render(
		<I18nProvider i18n={i18n}>
			<MobileViewSwitch value={value} onChange={onChange} />
		</I18nProvider>,
	);
	return onChange;
};

describe("MobileViewSwitch", () => {
	it("exposes the active view accessibly", () => {
		renderSwitch("editor");

		expect(screen.getByRole("navigation", { name: "Builder view" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Editor" })).toHaveAttribute("aria-current", "page");
		expect(screen.getByRole("button", { name: "Preview" })).not.toHaveAttribute("aria-current");
	});

	it("requests a view change", async () => {
		const onChange = renderSwitch("editor");

		await userEvent.click(screen.getByRole("button", { name: "Preview" }));

		expect(onChange).toHaveBeenCalledWith("preview");
	});
});
