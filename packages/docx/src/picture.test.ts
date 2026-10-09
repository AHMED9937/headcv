// @vitest-environment happy-dom

import type { Picture } from "@headcv/schema/resume/data";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadPicture } from "./picture";

const basePicture: Picture = {
	hidden: false,
	url: "/uploads/me.png",
	size: 72,
	rotation: 0,
	aspectRatio: 1,
	borderRadius: 0,
	borderColor: "rgba(0, 0, 0, 0.5)",
	borderWidth: 0,
	shadowColor: "rgba(0, 0, 0, 0.5)",
	shadowWidth: 0,
};

const pngBytes = () => new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).buffer;

const mockFetch = (impl: () => Promise<Response> | Response) => {
	vi.stubGlobal("fetch", vi.fn(impl));
};

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("loadPicture", () => {
	it("fetches and decodes a visible photo, converting pt size to px", async () => {
		mockFetch(() => new Response(pngBytes(), { status: 200 }));

		const result = await loadPicture(basePicture);

		expect(result).not.toBeNull();
		expect(result?.type).toBe("png");
		// 72pt at 96dpi = 96px; aspectRatio 1 keeps it square.
		expect(result?.widthPx).toBe(96);
		expect(result?.heightPx).toBe(96);
	});

	it("derives height from the aspect ratio", async () => {
		mockFetch(() => new Response(pngBytes(), { status: 200 }));

		const result = await loadPicture({ ...basePicture, aspectRatio: 2 });

		expect(result?.widthPx).toBe(96);
		expect(result?.heightPx).toBe(48);
	});

	it("returns null for a hidden photo without fetching", async () => {
		const fetchSpy = vi.fn();
		vi.stubGlobal("fetch", fetchSpy);

		expect(await loadPicture({ ...basePicture, hidden: true })).toBeNull();
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("returns null when the url is empty", async () => {
		expect(await loadPicture({ ...basePicture, url: "   " })).toBeNull();
	});

	it("returns null (not throw) when the fetch fails", async () => {
		mockFetch(() => Promise.reject(new Error("network")));
		expect(await loadPicture(basePicture)).toBeNull();
	});

	it("returns null when the response is not ok", async () => {
		mockFetch(() => new Response("nope", { status: 404 }));
		expect(await loadPicture(basePicture)).toBeNull();
	});

	it("returns null for an unsupported format (e.g. svg)", async () => {
		mockFetch(() => new Response(new Uint8Array([0x3c, 0x73, 0x76, 0x67]).buffer, { status: 200 }));
		expect(await loadPicture(basePicture)).toBeNull();
	});
});
