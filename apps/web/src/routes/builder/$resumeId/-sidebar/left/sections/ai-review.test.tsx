// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

const assistant = vi.hoisted(() => ({
	visibleChangedPreviewSectionIds: [] as string[],
	changedPreviewSectionIds: [] as string[],
}));

vi.mock("@/features/resume/builder/ai-assistant", () => ({ useAiAssistant: () => assistant }));
vi.mock("@/features/resume/builder/ai-review", () => ({
	AiReviewWorkspace: () => <div data-testid="ai-review-workspace" />,
}));
vi.mock("../shared/section-base", () => ({
	SectionBase: ({ type, badge, children }: { type: string; badge: React.ReactNode; children: React.ReactNode }) => (
		<section data-type={type}>
			<header>{badge}</header>
			{children}
		</section>
	),
}));

const { AiReviewSectionBuilder } = await import("./ai-review");

beforeAll(() => i18n.loadAndActivate({ locale: "en", messages: {} }));

function renderCard() {
	return render(
		<I18nProvider i18n={i18n}>
			<AiReviewSectionBuilder />
		</I18nProvider>,
	);
}

describe("AiReviewSectionBuilder", () => {
	it("shows the AI review as a section card with the number of sections to review", () => {
		assistant.visibleChangedPreviewSectionIds = ["summary", "experience"];
		const { container } = renderCard();

		expect(container.querySelector("section")).toHaveAttribute("data-type", "ai-review");
		expect(screen.getByText("2 sections to review")).toBeInTheDocument();
		expect(screen.getByTestId("ai-review-workspace")).toBeInTheDocument();
	});

	it("falls back to all changed sections when none are visible in the preview", () => {
		assistant.visibleChangedPreviewSectionIds = [];
		assistant.changedPreviewSectionIds = ["skills"];
		renderCard();

		expect(screen.getByText("1 section to review")).toBeInTheDocument();
	});
});
