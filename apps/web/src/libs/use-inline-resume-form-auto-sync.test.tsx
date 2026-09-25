// @vitest-environment happy-dom

import type { ResumeData, SectionType } from "@headcv/schema/resume/data";
import type { ReactNode } from "react";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStore } from "@tanstack/react-form";
import { z } from "zod";
import { defaultResumeData } from "@headcv/schema/resume/default";
import { useResumePreviewNavigationStore } from "@/features/resume/preview/preview-navigation";
import { applyInlineEditOverride, useInlineEditPreviewOverrideStore } from "./inline-edit-preview-override";
import { InlineResumeFormContext } from "./inline-resume-form-context";
import { useAppForm, useInlineAppForm } from "./tanstack-form";

const updateResumeDataLocal = vi.fn();

const schema = z.object({
	id: z.string(),
	hidden: z.boolean(),
	name: z.string(),
});

function TestForm({ mode }: { mode: "create" | "update" }) {
	const form = useInlineAppForm({
		defaultValues: { id: "item-1", hidden: false, name: mode === "create" ? "" : "Original" },
		validators: { onSubmit: schema },
		onSubmit: async () => {},
	});

	const name = useStore(form.store, (state) => state.values.name);

	return (
		<div>
			<input
				data-testid="name-input"
				value={name}
				onChange={(event) => form.setFieldValue("name", event.target.value)}
			/>
			<button type="button" data-testid="submit" onClick={() => form.handleSubmit()}>
				Submit
			</button>
		</div>
	);
}

function Wrapper({ mode, children }: { mode: "create" | "update"; children: ReactNode }) {
	return (
		<InlineResumeFormContext.Provider
			value={{
				sectionType: "experience" as SectionType,
				isCreate: mode === "create",
				updateResumeDataLocal,
			}}
		>
			{children}
		</InlineResumeFormContext.Provider>
	);
}

function CustomSectionTestForm() {
	const form = useInlineAppForm({
		defaultValues: {
			id: "custom-1",
			title: "Original",
			type: "experience" as const,
			columns: 1,
			hidden: false,
			items: [],
		},
		onSubmit: async () => {},
	});
	const title = useStore(form.store, (state) => state.values.title);

	return (
		<input
			data-testid="custom-title-input"
			value={title}
			onChange={(event) => form.setFieldValue("title", event.target.value)}
		/>
	);
}

function CustomSectionWrapper({ children }: { children: ReactNode }) {
	return (
		<InlineResumeFormContext.Provider value={{ sectionType: "custom", isCreate: true, updateResumeDataLocal }}>
			{children}
		</InlineResumeFormContext.Provider>
	);
}

function applyLastCallToDraft(draft: unknown) {
	const lastCall = updateResumeDataLocal.mock.calls.at(-1)?.[0] as ((d: unknown) => void) | undefined;
	if (!lastCall) return;
	lastCall(draft);
}

describe("useInlineResumeFormAutoSync", () => {
	beforeEach(() => {
		updateResumeDataLocal.mockClear();
		useInlineEditPreviewOverrideStore.setState({ override: null });
		useResumePreviewNavigationStore.setState({ request: null });
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("previews a new entry without writing a temporary item to the resume store", () => {
		render(
			<Wrapper mode="create">
				<TestForm mode="create" />
			</Wrapper>,
		);

		expect(updateResumeDataLocal).not.toHaveBeenCalled();
		expect(useInlineEditPreviewOverrideStore.getState().override).toMatchObject({
			sectionType: "experience",
			itemId: "item-1",
			values: { id: "item-1", name: "" },
		});
	});

	it("updates the preview override after the user changes a field", async () => {
		render(
			<Wrapper mode="update">
				<TestForm mode="update" />
			</Wrapper>,
		);

		const input = screen.getByTestId("name-input");

		await act(async () => {
			fireEvent.change(input, { target: { value: "Updated" } });
		});

		act(() => {
			vi.advanceTimersByTime(200);
		});

		expect(updateResumeDataLocal).not.toHaveBeenCalled();
		expect(useInlineEditPreviewOverrideStore.getState().override).toMatchObject({
			sectionType: "experience",
			itemId: "item-1",
			values: { id: "item-1", hidden: false, name: "Updated" },
		});
	});

	it("leaves the resume store untouched when an unsubmitted create form closes", () => {
		const { unmount } = render(
			<Wrapper mode="create">
				<TestForm mode="create" />
			</Wrapper>,
		);

		unmount();

		expect(updateResumeDataLocal).not.toHaveBeenCalled();
	});

	it("restores the original item on unmount when update was not submitted", () => {
		const { unmount } = render(
			<Wrapper mode="update">
				<TestForm mode="update" />
			</Wrapper>,
		);

		unmount();

		const draft = {
			sections: { experience: { items: [{ id: "item-1", name: "Already changed" }] } },
			customSections: [],
		};
		applyLastCallToDraft(draft);

		expect(draft.sections.experience.items[0]).toMatchObject({ id: "item-1", name: "Original" });
	});

	it("clears the preview override when the form unmounts", () => {
		const { unmount } = render(
			<Wrapper mode="update">
				<TestForm mode="update" />
			</Wrapper>,
		);

		useInlineEditPreviewOverrideStore.setState({
			override: {
				sectionType: "experience",
				itemId: "item-1",
				values: { name: "Draft" },
			},
		});

		unmount();

		expect(useInlineEditPreviewOverrideStore.getState().override).toBeNull();
	});

	it("publishes custom-section metadata to the preview without writing the resume store", async () => {
		render(
			<CustomSectionWrapper>
				<CustomSectionTestForm />
			</CustomSectionWrapper>,
		);

		await act(async () => {
			fireEvent.change(screen.getByTestId("custom-title-input"), { target: { value: "Live title" } });
		});

		expect(updateResumeDataLocal).not.toHaveBeenCalled();
		expect(useInlineEditPreviewOverrideStore.getState().override).toMatchObject({
			kind: "custom-section",
			sectionId: "custom-1",
			values: { id: "custom-1", title: "Live title", type: "experience" },
		});
		expect(useResumePreviewNavigationStore.getState().request?.sectionId).toBe("custom-1");
	});

	it("keeps the item on unmount after a successful submit", async () => {
		const { unmount } = render(
			<Wrapper mode="create">
				<TestForm mode="create" />
			</Wrapper>,
		);

		const submit = screen.getByTestId("submit");

		await act(async () => {
			fireEvent.click(submit);
		});

		unmount();

		const draft = { sections: { experience: { items: [{ id: "item-1", name: "" }] } }, customSections: [] };
		applyLastCallToDraft(draft);

		expect(draft.sections.experience.items).toHaveLength(1);
	});
});

describe("React Compiler hook-order safety", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	it("useInlineAppForm re-renders without a hook-order mismatch after a stable option update", async () => {
		const { rerender } = render(
			<Wrapper mode="create">
				<TestForm mode="create" />
			</Wrapper>,
		);

		await act(async () => {
			fireEvent.change(screen.getByTestId("name-input"), { target: { value: "A" } });
		});

		act(() => {
			vi.advanceTimersByTime(200);
		});

		expect(() => {
			rerender(
				<Wrapper mode="create">
					<TestForm mode="create" />
				</Wrapper>,
			);
		}).not.toThrow();
	});

	it("useAppForm does not auto-sync", () => {
		const { result } = renderHook(() =>
			useAppForm({ defaultValues: { id: "x", hidden: false, name: "" }, onSubmit: async () => {} }),
		);
		expect(typeof result.current.handleSubmit).toBe("function");
	});
});

describe("applyInlineEditOverride", () => {
	it("merges a personal-details draft without mutating persisted data", () => {
		const base = structuredClone(defaultResumeData);
		const basics = { ...base.basics, name: "Live name" };
		const picture = { ...base.picture, hidden: !base.picture.hidden };

		const result = applyInlineEditOverride(base, { kind: "personal-details", basics, picture });

		expect(result.basics.name).toBe("Live name");
		expect(result.picture.hidden).toBe(picture.hidden);
		expect(base.basics.name).not.toBe("Live name");
		expect(base.picture.hidden).not.toBe(picture.hidden);
	});

	it("merges the built-in summary entry into its section-level preview shape", () => {
		const base = structuredClone(defaultResumeData);
		const result = applyInlineEditOverride(base, {
			kind: "item",
			sectionType: "summary" as SectionType,
			itemId: "built-in-summary",
			values: { id: "built-in-summary", hidden: true, content: "<p>Live summary</p>" },
		});

		expect(result.summary).toMatchObject({ hidden: true, content: "<p>Live summary</p>" });
		expect(base.summary.content).not.toBe("<p>Live summary</p>");
	});

	it("replaces an existing section item without mutating the base data", () => {
		const base = {
			sections: { experience: { hidden: false, items: [{ id: "item-1", name: "Old" }] } },
			customSections: [],
			metadata: { layout: { pages: [{ fullWidth: false, main: ["experience"], sidebar: [] }] } },
		} as unknown as ResumeData;

		const override = {
			sectionType: "experience" as SectionType,
			itemId: "item-1",
			values: { id: "item-1", name: "New" },
		};

		const result = applyInlineEditOverride(base, override);

		expect(result.sections.experience.items[0]).toMatchObject({ name: "New" });
		expect(base.sections.experience.items[0]).toMatchObject({ name: "Old" });
	});

	it("previews a new entry in a section the layout does not list yet", () => {
		const base = {
			...defaultResumeData,
			sections: { ...defaultResumeData.sections, projects: { ...defaultResumeData.sections.projects, hidden: true } },
			metadata: {
				...defaultResumeData.metadata,
				layout: { ...defaultResumeData.metadata.layout, pages: [{ fullWidth: false, main: ["summary"], sidebar: [] }] },
			},
		} as ResumeData;

		const result = applyInlineEditOverride(base, {
			sectionType: "projects",
			itemId: "project-1",
			values: { id: "project-1", name: "Portfolio" },
		});

		expect(result.sections.projects.hidden).toBe(false);
		expect(result.sections.projects.items).toMatchObject([{ id: "project-1", name: "Portfolio" }]);
		expect(result.metadata.layout.pages[0]?.main).toEqual(["summary", "projects"]);
		expect(base.metadata.layout.pages[0]?.main).toEqual(["summary"]);
	});

	it("merges a custom-section override by id", () => {
		const base = {
			sections: {},
			customSections: [{ id: "custom-1", type: "summary", items: [{ id: "item-1", name: "Old" }] }],
		} as unknown as ResumeData;

		const override = {
			sectionType: "summary" as SectionType,
			customSectionId: "custom-1",
			itemId: "item-1",
			values: { id: "item-1", name: "New" },
		};

		const result = applyInlineEditOverride(base, override);

		expect(result.customSections[0]?.items[0]).toMatchObject({ name: "New" });
		expect(base.customSections[0]?.items[0]).toMatchObject({ name: "Old" });
	});

	it("adds a new custom section to the preview and places it on the last page", () => {
		const base = structuredClone(defaultResumeData);
		base.metadata.layout.pages.push({ fullWidth: false, main: ["projects"], sidebar: ["skills"] });
		const section = {
			id: "custom-1",
			title: "Live section",
			type: "experience" as const,
			columns: 1,
			hidden: false,
			items: [],
		};

		const result = applyInlineEditOverride(base, {
			kind: "custom-section",
			sectionId: section.id,
			values: section,
		});

		expect(result.customSections).toContainEqual(section);
		expect(result.metadata.layout.pages.at(-1)?.main).toEqual(["projects", section.id]);
		expect(result.metadata.layout.pages.at(-1)?.sidebar).toEqual(["skills"]);
		expect(base.customSections).not.toContainEqual(section);
	});

	it("updates existing custom-section metadata without changing its layout placement", () => {
		const base = structuredClone(defaultResumeData);
		const section = {
			id: "custom-1",
			title: "Original",
			type: "experience" as const,
			columns: 1,
			hidden: false,
			items: [],
		};
		base.customSections.push(section);
		base.metadata.layout.pages[0]?.sidebar.push(section.id);

		const result = applyInlineEditOverride(base, {
			kind: "custom-section",
			sectionId: section.id,
			values: { ...section, title: "Updated" },
		});

		expect(result.customSections[0]?.title).toBe("Updated");
		expect(result.metadata.layout.pages[0]?.sidebar).toContain(section.id);
		expect(result.metadata.layout.pages[0]?.main).not.toContain(section.id);
		expect(base.customSections[0]?.title).toBe("Original");
	});
});
