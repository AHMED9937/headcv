// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

vi.stubGlobal("__APP_VERSION__", "9.9.9");

// The footer module evaluates translated strings at module scope, so activate a
// locale before importing the component.
i18n.loadAndActivate({ locale: "en", messages: {} });

const { Copyright } = await import("./copyright");

const renderCopyright = () =>
	render(
		<I18nProvider i18n={i18n}>
			<Copyright />
		</I18nProvider>,
	);

describe("Copyright", () => {
	it("renders the HeadCV copyright notice", () => {
		const { container } = renderCopyright();
		expect(container.textContent).toMatch(/© \d{4} HeadCV\. All rights reserved\./);
	});

	it("renders the app version string", () => {
		renderCopyright();
		expect(screen.getByText(/HeadCV v9\.9\.9/)).toBeInTheDocument();
	});
});
