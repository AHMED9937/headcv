// @vitest-environment happy-dom

import type { ResumeData } from "@headcv/schema/resume/data";
import type React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { applyResumePatches } from "@headcv/resume/patch";
import { defaultResumeData } from "@headcv/schema/resume/default";

const keep = vi.fn();
const revert = vi.fn();
const editManually = vi.fn();
const editWithAI = vi.fn();
const regenerateSection = vi.fn();

const mockContext = vi.hoisted(() => ({
	action: undefined as Record<string, unknown> | undefined,
	snapshotData: undefined as ResumeData | undefined,
	reviewData: undefined as ResumeData | undefined,
	visibleChangedPreviewSectionIds: [] as string[],
	changedPreviewSectionIds: [] as string[],
	selectedReviewSectionId: null as string | null,
}));

vi.mock("@headcv/ui/components/scroll-area", () => ({
	ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("./draft", () => ({ useCurrentResume: () => ({ id: "r-1", data: defaultResumeData }) }));
vi.mock("./ai-assistant", () => ({
	useAiAssistant: () => ({
		...mockContext,
		keep,
		revert,
		editManually,
		editWithAI,
		regenerateSection,
		isKeeping: false,
		isReverting: false,
	}),
}));

const { AiReviewWorkspace } = await import("./ai-review");

beforeAll(() => i18n.loadAndActivate({ locale: "en", messages: {} }));
beforeEach(() => {
	mockContext.action = undefined;
	mockContext.snapshotData = undefined;
	mockContext.reviewData = undefined;
	mockContext.visibleChangedPreviewSectionIds = [];
	mockContext.changedPreviewSectionIds = [];
	mockContext.selectedReviewSectionId = null;
	vi.clearAllMocks();
});

function setPendingAction() {
	const snapshotData = structuredClone(defaultResumeData) as ResumeData;
	snapshotData.sections.skills.items = [
		{
			id: "s-1",
			hidden: false,
			icon: "circle",
			iconColor: "",
			name: "Languages",
			proficiency: "Advanced",
			level: 4,
			keywords: ["TypeScript"],
		},
	] as never;
	mockContext.action = {
		id: "action-1",
		title: "Improve skills",
		summary: "Added a framework keyword",
		operations: [{ op: "replace", path: "/sections/skills/items/0/keywords", value: ["TypeScript", "React"] }],
	};
	mockContext.snapshotData = snapshotData;
	mockContext.reviewData = applyResumePatches(snapshotData, [
		{ op: "replace", path: "/sections/skills/items/0/keywords", value: ["TypeScript", "React"] },
	]);
	mockContext.visibleChangedPreviewSectionIds = ["skills"];
	mockContext.changedPreviewSectionIds = ["skills"];
	mockContext.selectedReviewSectionId = "skills";
}

const renderWorkspace = () =>
	render(
		<I18nProvider i18n={i18n}>
			<AiReviewWorkspace />
		</I18nProvider>,
	);

describe("AiReviewWorkspace", () => {
	it("renders the empty state without a pending action", () => {
		renderWorkspace();
		expect(screen.getByText(/No AI-suggested changes to review right now./i)).toBeInTheDocument();
	});

	it("renders the single pending action and its changed section", () => {
		setPendingAction();
		renderWorkspace();
		expect(screen.getByText("Improve skills")).toBeInTheDocument();
		expect(screen.getByText("Skills")).toBeInTheDocument();
		expect(screen.getByText("Languages")).toBeInTheDocument();
		expect(screen.getAllByText("Keywords").length).toBeGreaterThan(0);
		expect(screen.getByText("Before")).toBeInTheDocument();
		expect(screen.getByText("After AI update")).toBeInTheDocument();
		expect(screen.getAllByText("TypeScript").length).toBeGreaterThanOrEqual(1);
		expect(screen.getByText("React")).toBeInTheDocument();
	});

	it("keeps or reverts the whole pending action", async () => {
		setPendingAction();
		renderWorkspace();
		await userEvent.click(screen.getByRole("button", { name: /Keep/i }));
		await userEvent.click(screen.getByRole("button", { name: /Revert/i }));
		expect(keep).toHaveBeenCalledOnce();
		expect(revert).toHaveBeenCalledOnce();
	});

	it("allows resolving a pending action even when no visible differences remain", async () => {
		setPendingAction();
		mockContext.visibleChangedPreviewSectionIds = [];
		mockContext.changedPreviewSectionIds = ["skills"];
		mockContext.selectedReviewSectionId = null;
		renderWorkspace();

		expect(screen.queryByText(/No AI-suggested changes to review/i)).not.toBeInTheDocument();
		expect(screen.getByText("Skills")).toBeInTheDocument();
		await userEvent.click(screen.getByRole("button", { name: "Keep" }));
		expect(keep).toHaveBeenCalledOnce();
		expect(screen.getByRole("button", { name: "Revert" })).toBeEnabled();
	});

	it("navigates to the changed section", async () => {
		setPendingAction();
		renderWorkspace();
		await userEvent.click(screen.getByRole("button", { name: /Go to section/i }));
		expect(editManually).toHaveBeenCalledWith("skills");
	});

	it("shows the actual summary text safely and keeps every section action accessible", async () => {
		setPendingAction();
		const snapshot = structuredClone(defaultResumeData);
		snapshot.summary.content = "<p>Original summary</p>";
		const operations = [
			{
				op: "replace" as const,
				path: "/summary/content",
				value: '<p>Improved <strong>summary</strong></p><img src=x onerror="alert(1)">',
			},
		];
		mockContext.action = { id: "action-summary", title: "Refine summary", operations };
		mockContext.snapshotData = snapshot;
		mockContext.reviewData = applyResumePatches(snapshot, operations);
		mockContext.visibleChangedPreviewSectionIds = ["summary"];
		mockContext.changedPreviewSectionIds = ["summary"];
		renderWorkspace();

		expect(screen.getByText("Before: Original summary. After AI update: Improved summary.")).toBeInTheDocument();
		expect(screen.getByText(/Original summary/)).toBeInTheDocument();
		expect(screen.getByText(/Improved summary/)).toBeInTheDocument();
		expect(screen.queryByRole("img")).not.toBeInTheDocument();
		await userEvent.click(screen.getByRole("button", { name: "Edit manually" }));
		await userEvent.click(screen.getByRole("button", { name: "Edit with AI" }));
		await userEvent.click(screen.getByRole("button", { name: "Regenerate" }));
		expect(editManually).toHaveBeenCalledWith("summary");
		expect(editWithAI).toHaveBeenCalledWith("summary");
		expect(regenerateSection).toHaveBeenCalledWith("summary");
	});
});
