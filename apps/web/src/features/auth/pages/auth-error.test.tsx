// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

const search = vi.hoisted(() => ({ error: undefined as string | undefined }));

vi.mock("@tanstack/react-router", () => ({
	useSearch: () => search,
	Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

const { AuthErrorPage, getAuthErrorMessage } = await import("./auth-error");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

describe("AuthErrorPage", () => {
	it("explains the error in plain language and links back to sign in (no raw code, no Ask AI)", () => {
		search.error = "state_mismatch";
		render(
			<I18nProvider i18n={i18n}>
				<AuthErrorPage />
			</I18nProvider>,
		);

		expect(screen.getByRole("heading", { name: "We couldn't sign you in" })).toBeInTheDocument();
		expect(screen.getByText("Your sign-in session expired. Please try again.")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Back to sign in" })).toHaveAttribute("href", "/auth/login");
		expect(screen.queryByText(/state_mismatch/)).not.toBeInTheDocument();
		expect(screen.queryByText(/Ask AI/i)).not.toBeInTheDocument();
	});

	it("falls back to a generic message for unknown codes", () => {
		expect(getAuthErrorMessage("something_new")).toBe("Something went wrong while signing you in. Please try again.");
		expect(getAuthErrorMessage(undefined)).toBe("Something went wrong while signing you in. Please try again.");
	});
});
