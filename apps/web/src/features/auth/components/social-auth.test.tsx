// @vitest-environment happy-dom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

const signInSocial = vi.hoisted(() => vi.fn(async () => ({ error: null })));

vi.mock("@tanstack/react-query", () => ({
	useQuery: () => ({ data: { credential: "Email", google: "Google" }, isLoading: false }),
}));
vi.mock("@/libs/orpc/client", () => ({
	orpc: { auth: { providers: { list: { queryOptions: () => ({}) } } } },
}));
vi.mock("@/libs/auth/client", () => ({ authClient: { signIn: { social: signInSocial } } }));
vi.mock("@tanstack/react-router", () => ({ useRouter: () => ({ invalidate: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { loading: vi.fn(), dismiss: vi.fn(), error: vi.fn() } }));

const { SocialAuth, getSocialSignInOptions } = await import("./social-auth");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

describe("SocialAuth", () => {
	it("Continue with Google signs in or signs up — the same on Login and Register", async () => {
		render(
			<I18nProvider i18n={i18n}>
				<SocialAuth />
			</I18nProvider>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

		await waitFor(() =>
			expect(signInSocial).toHaveBeenCalledWith({
				provider: "google",
				callbackURL: "/dashboard",
				requestSignUp: true,
			}),
		);
	});

	it("keeps the pending checkout plan in the callback URL", () => {
		expect(getSocialSignInOptions("google", "yearly")).toEqual({
			provider: "google",
			callbackURL: "/dashboard?checkoutPlan=yearly",
			requestSignUp: true,
		});
	});
});
