import { beforeEach, describe, expect, it } from "vitest";
import {
	getResumePreviewSectionId,
	requestResumePreviewSection,
	useResumePreviewNavigationStore,
} from "./preview-navigation";

describe("resume preview navigation", () => {
	beforeEach(() => {
		useResumePreviewNavigationStore.setState({ request: null });
	});

	it("creates a new request when reopening the same section", () => {
		requestResumePreviewSection("experience");
		const first = useResumePreviewNavigationStore.getState().request;
		requestResumePreviewSection("experience");
		const second = useResumePreviewNavigationStore.getState().request;

		expect(first?.sectionId).toBe("experience");
		expect(second?.sectionId).toBe("experience");
		expect(second?.id).toBeGreaterThan(first?.id ?? 0);
	});

	it("maps personal-details and picture interactions to the basics PDF marker", () => {
		expect(getResumePreviewSectionId("personal-details")).toBe("basics");
		expect(getResumePreviewSectionId("picture")).toBe("basics");
		expect(getResumePreviewSectionId("summary")).toBe("summary");
	});
});
