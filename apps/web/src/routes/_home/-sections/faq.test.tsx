// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { FAQ } from "./faq";

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

const renderFaq = () =>
	render(
		<I18nProvider i18n={i18n}>
			<FAQ />
		</I18nProvider>,
	);

describe("Landing FAQ", () => {
	it("shows the HeadCV product, privacy, language, ATS, and import questions", () => {
		renderFaq();
		expect(screen.getByRole("button", { name: /What is HeadCV and how does it work/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /How does HeadCV protect my data/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Does HeadCV support multiple languages/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Are HeadCV resumes ATS-friendly/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Can I import an existing resume into HeadCV/i })).toBeInTheDocument();
		expect(screen.queryByText(/FlowCV/i)).not.toBeInTheDocument();
	});

	it("keeps only one answer open at a time", async () => {
		renderFaq();
		const user = userEvent.setup();
		const first = screen.getByRole("button", { name: /What is HeadCV and how does it work/i });
		const second = screen.getByRole("button", { name: /Is HeadCV really free/i });

		await user.click(first);
		expect(first).toHaveAttribute("aria-expanded", "true");

		await user.click(second);
		expect(first).toHaveAttribute("aria-expanded", "false");
		expect(second).toHaveAttribute("aria-expanded", "true");
	});
});
