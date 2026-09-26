// @vitest-environment happy-dom

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRef } from "react";
import { useScrollSpy } from "./use-scroll-spy";

const sections = ["first", "second", "third"] as const;

function Harness() {
	const ref = useRef<HTMLDivElement | null>(null);
	const { active, scrollTo } = useScrollSpy(ref, sections, "first");

	return (
		<div>
			<output aria-label="active">{active}</output>
			<button type="button" onClick={() => scrollTo("third")}>
				Go to third
			</button>
			<div ref={ref} data-testid="container">
				{sections.map((id) => (
					<section key={id} id={`sidebar-${id}`} />
				))}
			</div>
		</div>
	);
}

const setTop = (element: Element, top: number) => {
	vi.spyOn(element, "getBoundingClientRect").mockReturnValue({ top } as DOMRect);
};

beforeEach(() => {
	vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
		callback(0);
		return 1;
	});
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

describe("useScrollSpy", () => {
	it("marks the last section whose top has crossed the activation line", () => {
		render(<Harness />);
		const container = screen.getByTestId("container");

		setTop(container, 0);
		setTop(document.getElementById("sidebar-first") as Element, -400);
		setTop(document.getElementById("sidebar-second") as Element, 40);
		setTop(document.getElementById("sidebar-third") as Element, 600);
		act(() => {
			container.dispatchEvent(new Event("scroll"));
		});

		expect(screen.getByLabelText("active")).toHaveTextContent("second");
	});

	it("highlights a clicked section immediately and ignores scroll events while it scrolls there", async () => {
		const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView").mockImplementation(() => {});
		render(<Harness />);
		const container = screen.getByTestId("container");

		await userEvent.click(screen.getByRole("button", { name: "Go to third" }));

		expect(screen.getByLabelText("active")).toHaveTextContent("third");
		expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });

		// Mid-scroll positions would otherwise point at "first".
		setTop(container, 0);
		for (const id of sections) setTop(document.getElementById(`sidebar-${id}`) as Element, 500);
		act(() => {
			container.dispatchEvent(new Event("scroll"));
		});

		expect(screen.getByLabelText("active")).toHaveTextContent("third");
	});
});
