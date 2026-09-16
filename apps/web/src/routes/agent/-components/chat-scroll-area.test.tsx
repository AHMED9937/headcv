// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { ChatScrollArea } from "./chat-scroll-area";

beforeAll(() => i18n.loadAndActivate({ locale: "en", messages: {} }));
afterEach(() => vi.unstubAllGlobals());

describe("ChatScrollArea", () => {
	it("follows growing replies, pauses when scrolled up, and resumes at the bottom", () => {
		let resize = () => {};
		const disconnect = vi.fn();
		vi.stubGlobal(
			"ResizeObserver",
			class {
				constructor(callback: () => void) {
					resize = callback;
				}
				observe() {}
				disconnect = disconnect;
			},
		);
		const { unmount } = render(<ChatScrollArea>Conversation</ChatScrollArea>);
		const viewport = screen.getByRole("region", { name: "Chat messages" });
		Object.defineProperties(viewport, {
			scrollHeight: { configurable: true, value: 1000 },
			clientHeight: { configurable: true, value: 300 },
		});
		resize();
		expect(viewport.scrollTop).toBe(1000);

		viewport.scrollTop = 100;
		fireEvent.scroll(viewport);
		Object.defineProperty(viewport, "scrollHeight", { value: 1200 });
		resize();
		expect(viewport.scrollTop).toBe(100);

		viewport.scrollTop = 900;
		fireEvent.scroll(viewport);
		Object.defineProperty(viewport, "scrollHeight", { value: 1400 });
		resize();
		expect(viewport.scrollTop).toBe(1400);
		unmount();
		expect(disconnect).toHaveBeenCalledOnce();
	});
});
