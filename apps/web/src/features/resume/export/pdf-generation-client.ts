import type { PdfGenerationPurpose, PdfGenerationRequest, PdfGenerationResponse } from "./pdf-generation.protocol";

type PdfGenerationInput = Omit<PdfGenerationRequest, "id">;

type PdfGenerationOptions = {
	purpose: PdfGenerationPurpose;
	signal?: AbortSignal;
};

type QueuedPdfGeneration = {
	id: number;
	input: PdfGenerationInput;
	purpose: PdfGenerationPurpose;
	signal?: AbortSignal;
	settled: boolean;
	resolve: (blob: Blob) => void;
	reject: (error: Error) => void;
	onAbort?: () => void;
};

export class PdfGenerationWorkerUnavailableError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "PdfGenerationWorkerUnavailableError";
	}
}

let worker: Worker | null = null;
let activeJob: QueuedPdfGeneration | null = null;
let nextRequestId = 1;
const queuedJobs: QueuedPdfGeneration[] = [];

const createAbortError = (message: string) => {
	const error = new Error(message);
	error.name = "AbortError";
	return error;
};

const removeAbortListener = (job: QueuedPdfGeneration) => {
	if (job.signal && job.onAbort) job.signal.removeEventListener("abort", job.onAbort);
};

const settleJob = (job: QueuedPdfGeneration, settle: () => void) => {
	if (job.settled) return;
	job.settled = true;
	removeAbortListener(job);
	settle();
};

const rejectJob = (job: QueuedPdfGeneration, error: Error) => {
	settleJob(job, () => job.reject(error));
};

const getWorker = () => {
	if (worker) return worker;
	if (typeof Worker === "undefined") {
		throw new PdfGenerationWorkerUnavailableError("PDF generation workers are unavailable in this browser.");
	}

	try {
		worker = new Worker(new URL("./pdf-generation.worker.tsx", import.meta.url), {
			name: "headcv-pdf-generation",
			type: "module",
		});
	} catch (cause) {
		throw new PdfGenerationWorkerUnavailableError("Failed to start the PDF generation worker.", { cause });
	}

	worker.onmessage = (event: MessageEvent<PdfGenerationResponse>) => {
		const response = event.data;
		const job = activeJob;
		if (!job || response.id !== job.id) return;

		activeJob = null;
		if (response.ok) {
			settleJob(job, () => job.resolve(new Blob([response.bytes], { type: "application/pdf" })));
		} else {
			const error = new Error(response.error.message);
			error.name = response.error.name;
			if (response.error.stack) error.stack = response.error.stack;
			rejectJob(job, error);
		}

		pumpQueue();
	};

	worker.onerror = (event) => {
		const error = new PdfGenerationWorkerUnavailableError(event.message || "The PDF generation worker crashed.");
		const failedWorker = worker;
		worker = null;
		failedWorker?.terminate();

		if (activeJob) rejectJob(activeJob, error);
		activeJob = null;
		for (const job of queuedJobs.splice(0)) rejectJob(job, error);
	};

	return worker;
};

function pumpQueue() {
	if (activeJob) return;

	const job = queuedJobs.shift();
	if (!job) return;
	if (job.signal?.aborted) {
		rejectJob(job, createAbortError("PDF generation was cancelled."));
		pumpQueue();
		return;
	}

	try {
		activeJob = job;
		getWorker().postMessage({ id: job.id, ...job.input } satisfies PdfGenerationRequest);
	} catch (cause) {
		activeJob = null;
		const error =
			cause instanceof Error
				? cause
				: new PdfGenerationWorkerUnavailableError("Failed to start PDF generation.", { cause });
		rejectJob(job, error);
		pumpQueue();
	}
}

const replaceQueuedPreview = () => {
	for (let index = queuedJobs.length - 1; index >= 0; index--) {
		const queuedJob = queuedJobs[index];
		if (queuedJob?.purpose !== "preview") continue;

		queuedJobs.splice(index, 1);
		rejectJob(queuedJob, createAbortError("PDF preview generation was superseded by a newer draft."));
	}
};

export function generateResumePdfInWorker(
	input: PdfGenerationInput,
	{ purpose, signal }: PdfGenerationOptions,
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const job: QueuedPdfGeneration = {
			id: nextRequestId++,
			input,
			purpose,
			signal,
			settled: false,
			resolve,
			reject,
		};

		if (signal?.aborted) {
			rejectJob(job, createAbortError("PDF generation was cancelled."));
			return;
		}

		job.onAbort = () => {
			const queuedIndex = queuedJobs.indexOf(job);
			if (queuedIndex !== -1) queuedJobs.splice(queuedIndex, 1);
			rejectJob(job, createAbortError("PDF generation was cancelled."));
		};
		signal?.addEventListener("abort", job.onAbort, { once: true });

		if (purpose === "preview") replaceQueuedPreview();
		if (purpose === "export") {
			const previewIndex = queuedJobs.findIndex((queuedJob) => queuedJob.purpose === "preview");
			if (previewIndex === -1) queuedJobs.push(job);
			else queuedJobs.splice(previewIndex, 0, job);
		} else {
			queuedJobs.push(job);
		}

		pumpQueue();
	});
}

export function disposePdfGenerationWorker() {
	worker?.terminate();
	worker = null;

	const error = createAbortError("PDF generation worker was disposed.");
	if (activeJob) rejectJob(activeJob, error);
	activeJob = null;
	for (const job of queuedJobs.splice(0)) rejectJob(job, error);
}
