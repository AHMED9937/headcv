import type { PdfGenerationRequest, PdfGenerationResponse } from "./pdf-generation.protocol";
import { createResumePdfBlob } from "@headcv/pdf/browser";

type PdfGenerationWorkerScope = {
	onmessage: ((event: MessageEvent<PdfGenerationRequest>) => void) | null;
	postMessage: (message: PdfGenerationResponse, transfer?: Transferable[]) => void;
};

const workerScope = self as unknown as PdfGenerationWorkerScope;

workerScope.onmessage = (event) => {
	const request = event.data;

	void createResumePdfBlob({
		data: request.data,
		template: request.template,
		sectionMarkerPrefix: request.sectionMarkerPrefix,
	})
		.then(async (blob) => {
			const bytes = await blob.arrayBuffer();
			workerScope.postMessage({ id: request.id, ok: true, bytes }, [bytes]);
		})
		.catch((cause: unknown) => {
			const error = cause instanceof Error ? cause : new Error(String(cause));
			workerScope.postMessage({
				id: request.id,
				ok: false,
				error: {
					message: error.message,
					name: error.name,
					...(error.stack ? { stack: error.stack } : {}),
				},
			});
		});
};
