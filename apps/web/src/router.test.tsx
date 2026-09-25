// @vitest-environment happy-dom

import type { ComponentType, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";

vi.mock("./routeTree.gen", async () => {
	const { createRootRoute } = await import("@tanstack/react-router");
	return { routeTree: createRootRoute() };
});
vi.mock("./libs/theme", () => ({ getTheme: async () => "light" }));
vi.mock("./libs/auth/session", () => ({ getSession: async () => null }));
vi.mock("./libs/locale", () => ({
	getLocale: async () => "en-US",
	loadLocale: async () => i18n.loadAndActivate({ locale: "en-US", messages: {} }),
}));
vi.mock("./libs/orpc/client", () => ({ client: { flags: { get: async () => ({}) } }, orpc: {} }));

const { getRouter } = await import("./router");
const { LoadingScreen } = await import("./components/layout/loading-screen");
const { ErrorScreen } = await import("./components/layout/error-screen");

describe("getRouter", () => {
	it("renders the loading and error screens inside the i18n provider (they show before the root route mounts)", async () => {
		const router = await getRouter();
		const Wrap = router.options.Wrap as ComponentType<{ children: ReactNode }>;
		expect(Wrap).toBeDefined();

		render(
			<Wrap>
				<LoadingScreen />
				<ErrorScreen error={new Error("boom")} reset={() => {}} />
			</Wrap>,
		);

		expect(screen.getByText("Loading…")).toBeInTheDocument();
		expect(screen.getByText("An error occurred while loading the page.")).toBeInTheDocument();
	});
});
