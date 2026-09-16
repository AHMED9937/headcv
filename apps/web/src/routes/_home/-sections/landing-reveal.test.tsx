// @vitest-environment happy-dom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { LandingReveal } from "./landing-reveal";

const originalAnimate = Object.getOwnPropertyDescriptor(Element.prototype, "animate");

afterEach(() => {
	cleanup();
	if (originalAnimate) Object.defineProperty(Element.prototype, "animate", originalAnimate);
	else Reflect.deleteProperty(Element.prototype, "animate");
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

it("keeps content visible without animation support", () => {
	vi.stubGlobal("IntersectionObserver", undefined);
	render(
		<LandingReveal>
			<p>Always readable</p>
		</LandingReveal>,
	);
	expect(screen.getByText("Always readable")).toBeVisible();
});

it("skips animation when reduced motion is requested", () => {
	const animate = vi.fn();
	Object.defineProperty(Element.prototype, "animate", { configurable: true, value: animate });
	vi.stubGlobal("matchMedia", () => ({ matches: true }));
	const observer = vi.fn();
	vi.stubGlobal("IntersectionObserver", observer);
	render(
		<LandingReveal>
			<p>Reduced motion</p>
		</LandingReveal>,
	);
	expect(screen.getByText("Reduced motion")).toBeVisible();
	expect(observer).not.toHaveBeenCalled();
	expect(animate).not.toHaveBeenCalled();
});
