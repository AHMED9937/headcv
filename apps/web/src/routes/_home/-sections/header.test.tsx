// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to, ...rest }: React.PropsWithChildren<{ to: string }>) => (
		<a href={typeof to === "string" ? to : "#"} {...rest}>
			{children}
		</a>
	),
}));
vi.mock("@/features/locale/combobox", () => ({
	LocaleCombobox: ({ render: renderProp }: { render: React.ReactElement }) => renderProp,
}));

i18n.loadAndActivate({ locale: "en", messages: {} });

const { Header } = await import("./header");

const renderHeader = () =>
	render(
		<I18nProvider i18n={i18n}>
			<Header />
		</I18nProvider>,
	);

describe("Header", () => {
	it("renders a homepage link with the HeadCV brand icon", () => {
		const { container } = renderHeader();
		const home = Array.from(container.querySelectorAll("a")).find((a) => a.getAttribute("href") === "/");
		expect(home).toBeDefined();
		expect(home?.getAttribute("aria-label")).toBe("HeadCV home");
	});

	it("renders a Sign in link as a secondary action", () => {
		const { container } = renderHeader();
		const signin = Array.from(container.querySelectorAll("a")).find((a) => a.getAttribute("href") === "/auth/login");
		expect(signin).toBeDefined();
		expect(signin?.textContent).toBe("Sign in");
	});

	it("renders a language selector button", () => {
		renderHeader();
		expect(screen.getByLabelText("Change language")).toBeInTheDocument();
	});

	it("does not render the upstream dashboard, theme toggle, or GitHub stars chrome", () => {
		const { container } = renderHeader();
		const links = Array.from(container.querySelectorAll("a")).map((a) => a.getAttribute("href"));
		expect(links).not.toContain("/dashboard");
		expect(container.querySelector('[data-testid="theme-toggle"]')).toBeNull();
		expect(container.querySelector('[data-testid="github-stars-button"]')).toBeNull();
	});

	it("labels the navigation landmark", () => {
		const { container } = renderHeader();
		const nav = container.querySelector("nav") as HTMLElement;
		expect(nav.getAttribute("aria-label")).toBe("Main navigation");
	});
});
