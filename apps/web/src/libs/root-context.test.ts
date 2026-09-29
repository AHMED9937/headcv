import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";

const mocks = vi.hoisted(() => ({
	getSession: vi.fn(),
	getFlags: vi.fn(),
	loadLocale: vi.fn(),
	locale: "en-US",
}));

vi.mock("./auth/session", () => ({ getSession: mocks.getSession }));
vi.mock("./orpc/client", () => ({ client: { flags: { get: mocks.getFlags } } }));
vi.mock("./theme", () => ({ getTheme: () => "light" }));
vi.mock("./locale", () => ({ getLocale: () => mocks.locale, loadLocale: mocks.loadLocale }));
vi.mock("@lingui/core", () => ({ i18n: { locale: "en-US" } }));

const { clearRootContextCache, loadRootContext } = await import("./root-context");

beforeEach(() => {
	vi.clearAllMocks();
	mocks.locale = "en-US";
	mocks.getSession.mockResolvedValue({ user: { id: "u1" } });
	mocks.getFlags.mockResolvedValue({ disableSignups: false, disableEmailAuth: false, signupEmailDomains: ["*"] });
});

describe("loadRootContext", () => {
	it("serves repeated navigations from cache instead of refetching", async () => {
		const queryClient = new QueryClient();

		const first = await loadRootContext(queryClient);
		await loadRootContext(queryClient);
		await loadRootContext(queryClient);

		expect(first).toMatchObject({ theme: "light", locale: "en-US", session: { user: { id: "u1" } } });
		expect(mocks.getSession).toHaveBeenCalledOnce();
		expect(mocks.getFlags).toHaveBeenCalledOnce();
		expect(mocks.loadLocale).not.toHaveBeenCalled();
	});

	it("refetches the session after the cache is cleared (sign-in/out calls router.invalidate)", async () => {
		const queryClient = new QueryClient();
		await loadRootContext(queryClient);

		mocks.getSession.mockResolvedValue(null);
		clearRootContextCache(queryClient);

		await expect(loadRootContext(queryClient)).resolves.toMatchObject({ session: null });
		expect(mocks.getSession).toHaveBeenCalledTimes(2);
	});

	it("loads catalogs only when the language changes", async () => {
		mocks.locale = "ar-SA";
		await loadRootContext(new QueryClient());
		expect(mocks.loadLocale).toHaveBeenCalledWith("ar-SA");
	});

	it("falls back to default flags when the flags request fails", async () => {
		mocks.getFlags.mockRejectedValue(new Error("offline"));
		await expect(loadRootContext(new QueryClient())).resolves.toMatchObject({
			flags: { disableSignups: false, disableEmailAuth: false },
		});
	});
});
