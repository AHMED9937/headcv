// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

let mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", async () => {
	const actual = await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");
	return {
		...actual,
		useNavigate: () => (options: { to: string }) => {
			mockNavigate(options.to);
		},
	};
});

vi.mock("@/features/locale/combobox", () => ({
	LocaleCombobox: ({ render: renderProp }: { render: React.ReactElement }) => renderProp,
}));

i18n.loadAndActivate({ locale: "en", messages: {} });

globalThis.IntersectionObserver = vi.fn(function MockIntersectionObserver() {
	return { observe: vi.fn(), disconnect: vi.fn(), unobserve: vi.fn() };
}) as unknown as typeof IntersectionObserver;

const { Hero } = await import("./-sections/hero");

const renderHero = () =>
	render(
		<I18nProvider i18n={i18n}>
			<Hero />
		</I18nProvider>,
	);

describe("Landing page CTA", () => {
	beforeEach(() => {
		mockNavigate = vi.fn();
	});

	it("renders the primary Create my CV CTA", () => {
		renderHero();
		expect(screen.getByRole("button", { name: /Create my CV/i })).toBeInTheDocument();
	});

	it("shows the honest commercial disclosure", () => {
		renderHero();
		expect(screen.getByText(/Free to build and preview/i)).toBeInTheDocument();
		expect(screen.getByText(/Paid tiers may be introduced later/i)).toBeInTheDocument();
	});

	it("navigates to template selection when the primary CTA is clicked", () => {
		renderHero();
		fireEvent.click(screen.getByRole("button", { name: /Create my CV/i }));
		expect(mockNavigate).toHaveBeenCalledWith("/templates");
	});
});
