// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

const openThreads = vi.hoisted(() => vi.fn());

vi.mock("./ai-assistant", () => ({
	useAiAssistant: () => ({ hasReviewableChanges: false, open: false, openThreads }),
}));

import { AiAssistantFab } from "./ai-assistant-fab";
import { AiFabClearance } from "./ai-fab-clearance";

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

beforeEach(() => {
	openThreads.mockClear();
});

const renderFab = () =>
	render(
		<I18nProvider i18n={i18n}>
			<AiAssistantFab />
		</I18nProvider>,
	);

// happy-dom has no layout engine, so these guard the class contract that keeps the FAB off the editor.
describe("AiAssistantFab", () => {
	it("is icon-only and lifts above bottom-pinned controls in single-pane layouts", () => {
		renderFab();
		const button = screen.getByRole("button", { name: "Open AI assistant" });

		// The full "AI Chat" pill covered form fields and the step bar's Continue button on phones.
		expect(screen.getByText("AI Chat")).toHaveClass("hidden", "lg:inline");
		expect(button).toHaveClass("size-12", "lg:w-auto");
		expect(button.parentElement).toHaveClass("max-lg:[:root:has([data-fab-avoid])_&]:bottom-22");
	});

	it("opens the assistant when tapped", () => {
		renderFab();
		fireEvent.click(screen.getByRole("button", { name: "Open AI assistant" }));
		expect(openThreads).toHaveBeenCalledOnce();
	});
});

describe("AiFabClearance", () => {
	it("reserves the FAB's footprint below lg without exposing anything to assistive tech", () => {
		const { container } = render(<AiFabClearance />);
		const spacer = container.firstElementChild;

		expect(spacer).toHaveAttribute("aria-hidden", "true");
		expect(spacer).toHaveClass("h-16", "lg:hidden");
	});
});
