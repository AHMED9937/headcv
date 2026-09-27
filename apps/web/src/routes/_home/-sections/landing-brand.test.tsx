// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingBrand } from "./landing-brand";

describe("LandingBrand", () => {
	it("keeps the monogram decorative so the link is named once, without redundant alt text", () => {
		render(
			<a href="/" aria-label="HeadCV home">
				<LandingBrand />
			</a>,
		);

		expect(screen.getByRole("link", { name: "HeadCV home" })).toBeInTheDocument();
		expect(screen.queryByRole("img")).not.toBeInTheDocument();
		expect(screen.getByText("CV")).toBeInTheDocument();
	});
});
