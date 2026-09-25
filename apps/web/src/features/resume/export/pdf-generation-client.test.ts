// @vitest-environment happy-dom

import type { PdfGenerationRequest, PdfGenerationResponse } from "./pdf-generation.protocol";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultResumeData } from "@headcv/schema/resume/default";

class FakeWorker {
	static instances: FakeWorker[] = [];

	onmessage: ((event: MessageEvent<PdfGenerationResponse>) => void) | null = null;
	onerror: ((event: ErrorEvent) => void) | null = null;
	readonly postMessage = vi.fn<(message: PdfGenerationRequest) => void>();
	readonly terminate = vi.fn();

	constructor() {
		FakeWorker.instances.push(this);
	}

	respond(response: PdfGenerationResponse) {
		this.onmessage?.({ data: response } as MessageEvent<PdfGenerationResponse>);
	}
}

describe("PDF generation worker client", () => {
	beforeEach(() => {
		FakeWorker.instances = [];
		vi.resetModules();
		vi.stubGlobal("Worker", FakeWorker);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("returns the transferred PDF bytes as a blob", async () => {
		const { disposePdfGenerationWorker, generateResumePdfInWorker } = await import("./pdf-generation-client");
		const result = generateResumePdfInWorker({ data: structuredClone(defaultResumeData) }, { purpose: "export" });
		const fakeWorker = FakeWorker.instances[0];
		const request = fakeWorker?.postMessage.mock.calls[0]?.[0];

		expect(request).toEqual(expect.objectContaining({ id: expect.any(Number), data: expect.any(Object) }));

		const bytes = new Uint8Array([37, 80, 68, 70]).buffer;
		fakeWorker?.respond({ id: request?.id ?? -1, ok: true, bytes });

		await expect(result).resolves.toEqual(expect.objectContaining({ size: 4, type: "application/pdf" }));
		disposePdfGenerationWorker();
	});

	it("keeps one active render and supersedes stale queued previews", async () => {
		const { disposePdfGenerationWorker, generateResumePdfInWorker } = await import("./pdf-generation-client");
		const input = { data: structuredClone(defaultResumeData) };
		const first = generateResumePdfInWorker(input, { purpose: "preview" });
		const stale = generateResumePdfInWorker(input, { purpose: "preview" });
		const staleResult = expect(stale).rejects.toMatchObject({ name: "AbortError" });
		const latest = generateResumePdfInWorker(input, { purpose: "preview" });
		const fakeWorker = FakeWorker.instances[0];

		expect(fakeWorker?.postMessage).toHaveBeenCalledTimes(1);
		const firstRequest = fakeWorker?.postMessage.mock.calls[0]?.[0];
		fakeWorker?.respond({ id: firstRequest?.id ?? -1, ok: true, bytes: new ArrayBuffer(1) });

		await first;
		await staleResult;
		expect(fakeWorker?.postMessage).toHaveBeenCalledTimes(2);

		const latestRequest = fakeWorker?.postMessage.mock.calls[1]?.[0];
		fakeWorker?.respond({ id: latestRequest?.id ?? -1, ok: true, bytes: new ArrayBuffer(2) });
		await expect(latest).resolves.toEqual(expect.objectContaining({ size: 2 }));

		disposePdfGenerationWorker();
	});
});
