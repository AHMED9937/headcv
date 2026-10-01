// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { SocialLinkPicker } from "./custom-fields";

beforeAll(() => i18n.loadAndActivate({ locale: "en", messages: {} }));

describe("SocialLinkPicker", () => {
	it("adds a selected social link with its brand icon", async () => {
		const onSelect = vi.fn();
		render(
			<I18nProvider i18n={i18n}>
				<SocialLinkPicker onSelect={onSelect} />
			</I18nProvider>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Add a link" }));
		await userEvent.type(screen.getByRole("textbox", { name: "Search links and social profiles" }), "linkedin");
		await userEvent.click(screen.getByRole("button", { name: "LinkedIn" }));

		expect(onSelect).toHaveBeenCalledWith(
			expect.objectContaining({ key: "linkedin", label: "LinkedIn", icon: "linkedin-logo" }),
		);
	});
});
