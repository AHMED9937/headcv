// @vitest-environment happy-dom

import type { UIMessage } from "ai";
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { i18n } from "@lingui/core";
import { ToolActivity } from "./tool-activity";

beforeAll(() => i18n.loadAndActivate({ locale: "en", messages: {} }));

describe("ToolActivity", () => {
	it.each([
		["read_resume", "Reading your resume…", "Resume read"],
		["read_attachment", "Reading attachment…", "Attachment read"],
		["web_search", "Searching the web…", "Web search complete"],
	])("shows progress and completion for %s", (tool, pending, complete) => {
		const part = {
			type: `tool-${tool}`,
			toolCallId: "call-1",
			state: "input-available",
			input: {},
		} as UIMessage["parts"][number];
		const { rerender } = render(<ToolActivity part={part} />);
		expect(screen.getByRole("status")).toHaveTextContent(pending);
		rerender(<ToolActivity part={{ ...part, state: "output-available", output: {} } as UIMessage["parts"][number]} />);
		expect(screen.getByRole("status")).toHaveTextContent(complete);
	});

	it("shows dynamic tool activity and a safe failure state", () => {
		const part: UIMessage["parts"][number] = {
			type: "dynamic-tool",
			toolName: "web_search",
			toolCallId: "call-1",
			state: "input-available",
			input: {},
		};
		const { rerender } = render(<ToolActivity part={part} />);
		expect(screen.getByRole("status")).toHaveTextContent("Searching the web…");
		rerender(<ToolActivity part={{ ...part, state: "output-error", errorText: "private service details" }} />);
		expect(screen.getByRole("status")).toHaveTextContent("This step failed. Please try again.");
		expect(screen.queryByText("private service details")).not.toBeInTheDocument();
	});

	it("does not render non-tool message parts", () => {
		render(<ToolActivity part={{ type: "step-start" }} />);
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
	});
});
