// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";

const navigate = vi.hoisted(() => vi.fn());
const openDialog = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigate,
}));

vi.mock("@/dialogs/store", () => ({
	useDialogStore: () => ({ openDialog }),
}));

import { CreateResumeCard } from "./create-card";
import { ImportResumeCard } from "./import-card";

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

beforeEach(() => {
	vi.clearAllMocks();
});

describe("CreateResumeCard", () => {
	it("renders the create-resume copy", () => {
		render(<CreateResumeCard />);
		expect(screen.getByText("Create a new resume")).toBeInTheDocument();
		expect(screen.getByText("Choose a template and start building")).toBeInTheDocument();
	});

	it("opens template selection when clicked", () => {
		render(<CreateResumeCard />);

		const card = screen.getByText("Create a new resume").closest("div[class*='aspect-page']") as HTMLElement;
		fireEvent.click(card);

		expect(navigate).toHaveBeenCalledWith({ to: "/templates" });
	});
});

describe("ImportResumeCard", () => {
	it("renders the import-resume copy", () => {
		render(<ImportResumeCard />);
		expect(screen.getByText("Import an existing resume")).toBeInTheDocument();
		expect(screen.getByText("Continue where you left off")).toBeInTheDocument();
	});

	it("opens the resume import dialog when clicked", () => {
		render(<ImportResumeCard />);

		const card = screen.getByText("Import an existing resume").closest("div[class*='aspect-page']") as HTMLElement;
		fireEvent.click(card);

		expect(openDialog).toHaveBeenCalledWith("resume.import", undefined);
	});
});
