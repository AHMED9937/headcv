// @vitest-environment happy-dom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { useState } from "react";
import { DEFAULT_PDF_PAGE_SIZE } from "@/features/resume/preview/preview.shared";
import { getDialogPageScale, PreviewDialog } from "./preview-dialog";

vi.mock("@/features/resume/preview/preview", () => ({
	ResumePreview: () => <div data-testid="resume-preview" />,
}));

class ResizeObserverMock {
	observe() {}
	disconnect() {}
	unobserve() {}
}

function PreviewDialogHarness() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<button type="button" onClick={() => setOpen(true)}>
				Open preview
			</button>
			<PreviewDialog open={open} onOpenChange={setOpen} />
		</>
	);
}

describe("PreviewDialog", () => {
	beforeAll(() => {
		i18n.loadAndActivate({ locale: "en", messages: {} });
		vi.stubGlobal("ResizeObserver", ResizeObserverMock);
	});

	it("opens the full-size preview and closes it from the dialog control", async () => {
		const user = userEvent.setup();
		render(<PreviewDialogHarness />);

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		await user.click(screen.getByRole("button", { name: "Open preview" }));

		expect(screen.getByRole("dialog", { name: "Resume preview" })).toBeInTheDocument();
		expect(screen.getByTestId("resume-preview")).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Close" }));
		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
	});

	it("fills the available width responsively without exceeding the desktop target", () => {
		expect(getDialogPageScale(1024)).toBe(880 / DEFAULT_PDF_PAGE_SIZE.width);
		expect(getDialogPageScale(600)).toBe(568 / DEFAULT_PDF_PAGE_SIZE.width);
	});
});
