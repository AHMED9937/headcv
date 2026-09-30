// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

const signUpEmail = vi.hoisted(() => vi.fn());
const sendVerificationEmail = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", () => ({
	useQuery: () => ({ data: { credential: "Password", google: "Google", apple: "Apple" }, isLoading: false }),
}));
vi.mock("@/libs/orpc/client", () => ({
	orpc: { auth: { providers: { list: { queryOptions: () => ({}) } } } },
}));
vi.mock("@/libs/auth/client", () => ({
	authClient: { sendVerificationEmail, signIn: {}, signUp: { email: signUpEmail } },
}));
vi.mock("@tanstack/react-router", () => ({
	Link: ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
		<a href={to} className={className}>
			{children}
		</a>
	),
	useRouter: () => ({ invalidate: vi.fn() }),
}));

const { RegisterPage } = await import("./register");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

beforeEach(() => {
	signUpEmail.mockReset();
	signUpEmail.mockResolvedValue({ error: null });
	sendVerificationEmail.mockReset();
	sendVerificationEmail.mockResolvedValue({ error: null });
});

const renderRegister = (signupEmailDomains = ["gmail.com", "outlook.com"]) =>
	render(<RegisterPage disableEmailAuth={false} signupEmailDomains={signupEmailDomains} />, {
		wrapper: ({ children }) => <I18nProvider i18n={i18n}>{children}</I18nProvider>,
	});

const fillForm = async (email: string) => {
	const user = userEvent.setup();
	await user.type(screen.getByLabelText("Name"), "John Doe");
	await user.type(screen.getByLabelText("Username"), "john.doe");
	await user.type(screen.getByLabelText("Email Address"), email);
	await user.type(screen.getByLabelText("Password"), "correct-horse");
	await user.click(screen.getByRole("button", { name: "Sign up" }));
};

describe("RegisterPage", () => {
	it("places the sign-in link below the Sign up button", () => {
		renderRegister();

		const signUp = screen.getByRole("button", { name: "Sign up" });
		const signIn = screen.getByRole("link", { name: /Sign in now/ });

		expect(signIn).toHaveAttribute("href", "/auth/login");
		expect(signUp.compareDocumentPosition(signIn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	it("lists the accepted email domains", () => {
		renderRegister();

		expect(screen.getByText("Use an address from: gmail.com, outlook.com")).toBeInTheDocument();
	});

	it("rejects an email from an untrusted domain without calling the server", async () => {
		renderRegister();
		await fillForm("john@mailinator.com");

		expect(
			await screen.findByText("Please use an email from a trusted provider (gmail.com, outlook.com)."),
		).toBeInTheDocument();
		expect(signUpEmail).not.toHaveBeenCalled();
	});

	it("rejects a malformed email without calling the server", async () => {
		renderRegister();
		await fillForm("not-an-email");

		expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
		expect(signUpEmail).not.toHaveBeenCalled();
	});

	it("requires verification after signup and does not offer a dashboard bypass", async () => {
		renderRegister();
		await fillForm("john@gmail.com");

		expect(await screen.findByText("Email verification is required.")).toBeInTheDocument();
		expect(screen.queryByRole("link", { name: "Continue" })).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Resend verification email" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /Sign in instead/ })).toHaveAttribute("href", "/auth/login");
	});

	it("resends verification to the submitted address", async () => {
		renderRegister();
		await fillForm("john@gmail.com");
		await userEvent.click(await screen.findByRole("button", { name: "Resend verification email" }));

		expect(sendVerificationEmail).toHaveBeenCalledWith({ email: "john@gmail.com", callbackURL: "/dashboard" });
	});

	it("submits an email from a trusted domain", async () => {
		renderRegister();
		await fillForm("john@gmail.com");

		await vi.waitFor(() =>
			expect(signUpEmail).toHaveBeenCalledWith(expect.objectContaining({ email: "john@gmail.com" })),
		);
	});

	it("accepts any domain and hides the hint when the allowlist is a wildcard", async () => {
		renderRegister(["*"]);

		expect(screen.queryByText(/Use an address from/)).toBeNull();
		await fillForm("john@company.io");

		await vi.waitFor(() =>
			expect(signUpEmail).toHaveBeenCalledWith(expect.objectContaining({ email: "john@company.io" })),
		);
	});
});
