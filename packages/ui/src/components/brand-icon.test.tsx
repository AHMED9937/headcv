import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandIcon } from "./brand-icon";

describe("BrandIcon", () => {
	it("renders one canonical logo image", () => {
		render(<BrandIcon />);
		const imgs = screen.getAllByAltText("HeadCV");
		expect(imgs).toHaveLength(1);
		expect(imgs[0]).toHaveAttribute("src", "/brand/headcv-logo.png");
		expect(imgs[0]).toHaveClass("size-14");
	});

	it("merges custom className", () => {
		render(<BrandIcon className="my-custom" />);
		const imgs = screen.getAllByAltText("HeadCV");
		expect(imgs[0]).toHaveClass("my-custom");
	});
});
