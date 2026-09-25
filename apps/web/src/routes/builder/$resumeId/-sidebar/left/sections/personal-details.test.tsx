// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { useResumePreviewNavigationStore } from "@/features/resume/preview/preview-navigation";
import { useInlineEditPreviewOverrideStore } from "@/libs/inline-edit-preview-override";
import { BuilderSectionNavigationProvider } from "../../../-components/section-navigation-context";

const navigateToSection = vi.fn();
const updateResumeData = vi.fn();
const resume = {
	data: {
		basics: {
			name: "John Doe",
			headline: "Engineer",
			email: "john@example.com",
			phone: "+123",
			location: "Remote",
			website: { url: "https://example.com", label: "Portfolio" },
			customFields: [],
		},
		picture: {
			hidden: false,
			url: "/uploads/photo.jpg",
			size: 80,
			rotation: 0,
			aspectRatio: 1,
			borderRadius: 0,
			borderColor: "rgba(0, 0, 0, 0)",
			borderWidth: 0,
			shadowColor: "rgba(0, 0, 0, 0)",
			shadowWidth: 0,
		},
	},
};

vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => resume,
	useUpdateResumeData: () => updateResumeData,
}));
vi.mock("./basics", () => ({
	BasicsSectionForm: ({ onChange }: { onChange: (value: typeof resume.data.basics) => void }) => (
		<button type="button" onClick={() => onChange({ ...resume.data.basics, name: "Jane Doe" })}>
			Change name
		</button>
	),
}));
vi.mock("./picture", () => ({
	PictureSectionForm: () => <div data-testid="picture-form">Picture form</div>,
}));
vi.mock("@/components/section-tips", () => ({ SectionTips: () => <div>Personal details tips</div> }));

const { PersonalDetailsSectionBuilder } = await import("./personal-details");

beforeAll(() => i18n.loadAndActivate({ locale: "en", messages: {} }));

beforeEach(() => {
	vi.clearAllMocks();
	useResumePreviewNavigationStore.setState({ request: null });
	useInlineEditPreviewOverrideStore.setState({ override: null });
});

function renderPersonalDetails() {
	return render(
		<I18nProvider i18n={i18n}>
			<BuilderSectionNavigationProvider navigateToSection={navigateToSection}>
				<PersonalDetailsSectionBuilder />
			</BuilderSectionNavigationProvider>
		</I18nProvider>,
	);
}

describe("PersonalDetailsSectionBuilder", () => {
	it("renders the compact personal details summary", () => {
		renderPersonalDetails();
		expect(screen.getByText("John Doe")).toBeInTheDocument();
		expect(screen.getByText("Engineer")).toBeInTheDocument();
		expect(screen.getByText("john@example.com")).toBeInTheDocument();
		expect(screen.queryByText("Edit Personal Details")).not.toBeInTheDocument();
	});

	it("opens the editor and navigates the preview", async () => {
		renderPersonalDetails();
		await userEvent.click(screen.getByRole("button", { name: "Edit Personal Details" }));
		expect(screen.getByText("Edit Personal Details")).toBeInTheDocument();
		expect(navigateToSection).toHaveBeenCalledWith("basics");
		expect(useResumePreviewNavigationStore.getState().request?.sectionId).toBe("basics");
		expect(useInlineEditPreviewOverrideStore.getState().override).toBeNull();
	});

	it("updates only the live preview draft until Done", async () => {
		renderPersonalDetails();
		await userEvent.click(screen.getByRole("button", { name: "Edit Personal Details" }));
		await userEvent.click(screen.getByRole("button", { name: "Change name" }));
		expect(updateResumeData).not.toHaveBeenCalled();
		expect(useInlineEditPreviewOverrideStore.getState().override).toMatchObject({
			kind: "personal-details",
			basics: { name: "Jane Doe" },
		});
		await userEvent.click(screen.getByRole("button", { name: "Done" }));
		expect(updateResumeData).toHaveBeenCalledOnce();
		expect(useInlineEditPreviewOverrideStore.getState().override).toBeNull();
	});

	it("discards the preview draft on Back", async () => {
		renderPersonalDetails();
		await userEvent.click(screen.getByRole("button", { name: "Edit Personal Details" }));
		await userEvent.click(screen.getByRole("button", { name: "Change name" }));
		await userEvent.click(screen.getByRole("button", { name: "Back" }));
		expect(updateResumeData).not.toHaveBeenCalled();
		expect(useInlineEditPreviewOverrideStore.getState().override).toBeNull();
		expect(screen.getByText("John Doe")).toBeInTheDocument();
	});
});
