// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

const media = vi.hoisted(() => ({ singlePane: false, query: "" }));

vi.mock("@headcv/ui/hooks/use-media-query", () => ({
	useMediaQuery: (query: string) => {
		media.query = query;
		return media.singlePane;
	},
}));

const { BuilderSplitView, BUILDER_SINGLE_PANE_QUERY } = await import("./split-view");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

beforeEach(() => {
	media.singlePane = false;
	media.query = "";
});

const renderSplitView = () =>
	render(
		<I18nProvider i18n={i18n}>
			<BuilderSplitView editor={<div>Editor pane</div>} preview={<div>Preview pane</div>} />
		</I18nProvider>,
	);

describe("BuilderSplitView", () => {
	it("goes single-pane below lg, where a form and an A4 preview no longer fit side by side", () => {
		renderSplitView();
		expect(media.query).toBe(BUILDER_SINGLE_PANE_QUERY);
		expect(BUILDER_SINGLE_PANE_QUERY).toBe("(max-width: 1023px)");
	});

	it("shows the editor and preview side by side when there is room", () => {
		renderSplitView();
		expect(screen.getByText("Editor pane")).toBeInTheDocument();
		expect(screen.getByText("Preview pane")).toBeInTheDocument();
		expect(screen.queryByRole("navigation", { name: "Builder view" })).not.toBeInTheDocument();
	});

	it("shows one pane at a time with a switch in single-pane layouts", async () => {
		media.singlePane = true;
		renderSplitView();

		expect(screen.getByRole("navigation", { name: "Builder view" })).toBeInTheDocument();
		expect(screen.getByText("Editor pane")).toBeInTheDocument();
		expect(screen.queryByText("Preview pane")).not.toBeInTheDocument();

		await userEvent.click(screen.getByRole("button", { name: "Preview" }));
		expect(screen.getByText("Preview pane")).toBeInTheDocument();
		expect(screen.queryByText("Editor pane")).not.toBeInTheDocument();
	});
});
