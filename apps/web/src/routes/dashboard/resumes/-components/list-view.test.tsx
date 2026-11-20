// @vitest-environment happy-dom

import type { ComponentProps, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
	Link: ({ params: _params, to, ...props }: ComponentProps<"a"> & { params?: unknown; to?: string }) => (
		<a href={to} {...props} />
	),
}));

vi.mock("@/dialogs/store", () => ({
	useDialogStore: () => ({ openDialog: vi.fn() }),
}));

vi.mock("./menus/dropdown-menu", () => ({
	ResumeDropdownMenu: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import { ListView } from "./list-view";

type Resume = ComponentProps<typeof ListView>["resumes"][number];

const resume = {
	id: "resume-1",
	name: "Senior Frontend Engineer Resume",
	updatedAt: new Date("2026-11-20T10:00:00Z"),
} as Resume;

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

const renderList = () =>
	render(
		<I18nProvider i18n={i18n}>
			<ListView resumes={[resume]} />
		</I18nProvider>,
	);

// happy-dom has no layout engine, so these guard the class contract that keeps rows inside a phone's width.
describe("ListView", () => {
	it("lets every row title truncate instead of forcing a 320px width on phones", () => {
		renderList();

		for (const title of ["Create a new resume", "Import an existing resume", resume.name]) {
			const element = screen.getByText(title);
			expect(element).toHaveClass("truncate");
			// An unconditional min-w-80 pushed rows past the viewport and scrolled the whole page sideways.
			expect(element).not.toHaveClass("min-w-80");
			expect(element).toHaveClass("sm:min-w-80");
		}
	});

	it("lets the resume link and its description shrink beside the actions menu", () => {
		renderList();

		expect(screen.getByText(resume.name).closest("a")).toHaveClass("min-w-0");
		expect(screen.getByText(/Last updated on/)).toHaveClass("truncate");
	});
});
