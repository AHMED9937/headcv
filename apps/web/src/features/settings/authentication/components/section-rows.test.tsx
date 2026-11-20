// @vitest-environment happy-dom

import type { ComponentProps, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

vi.mock("./hooks", () => ({
	useAuthAccounts: () => ({ hasAccount: () => true, getAccountByProviderId: () => ({ accountId: "account-1" }) }),
	useAuthProviderActions: () => ({ link: vi.fn(), unlink: vi.fn() }),
	getProviderName: () => "Google",
	getProviderIcon: () => null,
}));

vi.mock("@/dialogs/store", () => ({
	useDialogStore: () => ({ openDialog: vi.fn() }),
}));

vi.mock("@/libs/auth/client", () => ({
	authClient: { useSession: () => ({ data: { user: { twoFactorEnabled: false } } }) },
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
	Link: ({ to, ...props }: ComponentProps<"a"> & { to?: string }) => <a href={to} {...props} />,
}));

import { PasswordSection } from "./password";
import { SocialProviderSection } from "./social-provider";
import { TwoFactorSection } from "./two-factor";

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

const sections: [title: string, renderSection: () => ReactNode][] = [
	["Password", () => <PasswordSection />],
	["Two-Factor Authentication", () => <TwoFactorSection />],
	["Google", () => <SocialProviderSection provider="google" />],
];

// happy-dom has no layout engine, so this guards the class contract (same pattern as the passkeys row).
describe("authentication settings rows", () => {
	it.each(sections)("lets the %s action wrap under its title on narrow screens", (title, renderSection) => {
		render(<I18nProvider i18n={i18n}>{renderSection()}</I18nProvider>);
		const row = screen.getByRole("heading", { name: title }).parentElement;
		expect(row).toHaveClass("flex-wrap", "justify-between");
	});
});
