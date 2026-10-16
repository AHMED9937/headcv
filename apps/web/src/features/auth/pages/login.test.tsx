// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

const providers = vi.hoisted(() => ({ current: {} as Record<string, string> }));

vi.mock("@tanstack/react-query", () => ({
	useQuery: () => ({ data: providers.current, isLoading: false }),
}));
vi.mock("@/libs/orpc/client", () => ({
	client: {},
	orpc: { auth: { providers: { list: { queryOptions: () => ({}) } } } },
}));
vi.mock("@/libs/auth/client", () => ({ authClient: { signIn: {} } }));
vi.mock("@tanstack/react-router", () => ({
	Link: ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
		<a href={to} className={className}>
			{children}
		</a>
	),
	useNavigate: () => vi.fn(),
	useRouter: () => ({ invalidate: vi.fn() }),
}));

const { LoginPage } = await import("./login");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

beforeEach(() => {
	providers.current = { credential: "Password", google: "Google", apple: "Apple" };
});

const renderLogin = (props: Partial<React.ComponentProps<typeof LoginPage>> = {}) =>
	render(<LoginPage disableEmailAuth={false} disableSignups={false} {...props} />, {
		wrapper: ({ children }) => <I18nProvider i18n={i18n}>{children}</I18nProvider>,
	});

const follows = (later: Element, earlier: Element) =>
	Boolean(earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING);

describe("LoginPage", () => {
	it("places the create-account link below the Sign in button", () => {
		renderLogin();

		const signIn = screen.getByRole("button", { name: "Sign in" });
		const createAccount = screen.getByRole("link", { name: /Create one now/ });

		expect(createAccount).toHaveAttribute("href", "/auth/register");
		expect(follows(createAccount, signIn)).toBe(true);
	});

	it("hides the create-account link when sign-ups are disabled", () => {
		renderLogin({ disableSignups: true });

		expect(screen.queryByRole("link", { name: /Create one now/ })).toBeNull();
	});

	it("still offers the create-account link when only social sign-in is enabled", () => {
		renderLogin({ disableEmailAuth: true });

		expect(screen.queryByRole("button", { name: "Sign in" })).toBeNull();
		expect(screen.getByRole("link", { name: /Create one now/ })).toBeInTheDocument();
	});

	it("offers Google and Apple sign-in, and no passkey unless it is enabled", () => {
		renderLogin();

		expect(screen.getByRole("button", { name: "Continue with Google" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Apple" })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Passkey" })).toBeNull();
	});

	it("shows the passkey button when the server enables it", () => {
		providers.current = { ...providers.current, passkey: "Passkey" };
		renderLogin();

		expect(screen.getByRole("button", { name: "Passkey" })).toBeInTheDocument();
	});

	it("drops the social divider when no social provider is configured", () => {
		providers.current = { credential: "Password" };
		renderLogin();

		expect(screen.queryByText("or continue with")).toBeNull();
	});
});
