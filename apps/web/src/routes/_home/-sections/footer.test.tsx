// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

vi.stubGlobal("__APP_VERSION__", "9.9.9");

// The footer module evaluates translated strings at module scope, so activate a
// locale before importing the component.
i18n.loadAndActivate({ locale: "en", messages: {} });

const { Footer } = await import("./footer");

const renderFooter = () =>
	render(
		<I18nProvider i18n={i18n}>
			<Footer />
		</I18nProvider>,
	);

describe("Footer", () => {
	it("renders the HeadCV brand and tagline", () => {
		const { container } = renderFooter();
		const logos = Array.from(container.querySelectorAll("img")).filter((img) => img.alt === "HeadCV");
		expect(logos.length).toBeGreaterThan(0);
		expect(container.textContent).toContain("HeadCV is a guided CV builder");
	});

	it("renders Support and Legal link group headings", () => {
		renderFooter();
		expect(screen.getByText("Support")).toBeInTheDocument();
		expect(screen.getByText("Legal")).toBeInTheDocument();
	});

	it("renders support and legal links", () => {
		const { container } = renderFooter();
		const text = container.textContent ?? "";
		for (const label of ["Help Center", "Contact Support", "Privacy Policy", "Terms of Service"]) {
			expect(text, label).toContain(label);
		}
	});

	it("does not render upstream social links or source code references", () => {
		const { container } = renderFooter();
		const hrefs = Array.from(container.querySelectorAll<HTMLAnchorElement>("a")).map((a) => a.href);
		expect(hrefs.some((h) => h.includes("github.com/AHMED9937"))).toBe(false);
		expect(hrefs.some((h) => h.includes("x.com/KingOKings"))).toBe(false);
		expect(hrefs.some((h) => h.includes("linkedin.com/in/AHMED9937"))).toBe(false);
	});

	it("includes the HeadCV copyright notice", () => {
		const { container } = renderFooter();
		const text = container.textContent ?? "";
		expect(text).toMatch(/© \d{4} HeadCV\. All rights reserved\./);
	});
});
