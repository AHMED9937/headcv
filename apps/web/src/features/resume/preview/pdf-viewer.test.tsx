// @vitest-environment happy-dom

import { act, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRef } from "react";

type AnnotationFixture = {
	rect: [number, number, number, number];
	subtype: string;
	url: string;
};

const viewerMock = vi.hoisted(() => {
	const page = {
		getAnnotations: vi.fn<() => Promise<AnnotationFixture[]>>(async () => []),
	};
	const pdfDocument = {
		destroy: vi.fn(),
		getPage: vi.fn(async () => page),
		numPages: 1,
	};
	const loadingTask = {
		destroy: vi.fn(),
		promise: Promise.resolve(pdfDocument),
	};

	return {
		constructorOptions: [] as Array<{ abortSignal?: AbortSignal; container: HTMLDivElement }>,
		getDocument: vi.fn(() => loadingTask),
		instances: [] as Array<{
			currentScaleValue: string;
			scrollMode: number;
			setDocument: ReturnType<typeof vi.fn>;
			update: ReturnType<typeof vi.fn>;
		}>,
		loadingTask,
		page,
		pdfDocument,
	};
});

vi.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({
	AnnotationMode: { DISABLE: 0, ENABLE_FORMS: 2 },
	getDocument: viewerMock.getDocument,
	GlobalWorkerOptions: {},
}));

vi.mock("pdfjs-dist/legacy/web/pdf_viewer.mjs", () => {
	class EventBus {
		private readonly listeners = new Map<string, Set<(event: never) => void>>();

		on(name: string, listener: (event: never) => void) {
			const listeners = this.listeners.get(name) ?? new Set();
			listeners.add(listener);
			this.listeners.set(name, listeners);
		}

		off(name: string, listener: (event: never) => void) {
			this.listeners.get(name)?.delete(listener);
		}

		dispatch(name: string, event?: unknown) {
			for (const listener of this.listeners.get(name) ?? []) listener(event as never);
		}
	}

	class PDFLinkService {
		setDocument = vi.fn();
		setViewer = vi.fn();
	}

	class PDFViewer {
		currentScaleValue = "";
		scrollMode = 0;
		setDocument: ReturnType<typeof vi.fn>;
		update = vi.fn();

		constructor(options: {
			abortSignal?: AbortSignal;
			container: HTMLDivElement;
			eventBus: EventBus;
			viewer: HTMLDivElement;
		}) {
			viewerMock.constructorOptions.push(options);
			this.setDocument = vi.fn((document: { numPages: number } | null) => {
				if (!document) return;
				const page = window.document.createElement("div");
				page.className = "page";
				Object.defineProperties(page, {
					offsetLeft: { configurable: true, value: 0 },
					offsetTop: { configurable: true, value: 0 },
				});
				options.viewer.append(page);
				options.eventBus.dispatch("pagesinit");
				options.eventBus.dispatch("pagerendered", { pageNumber: 1 });
			});
			viewerMock.instances.push(this);
		}

		getPageView() {
			return { viewport: { convertToViewportRectangle: (rect: number[]) => rect } };
		}
	}

	return {
		EventBus,
		LinkTarget: { BLANK: 2 },
		PDFLinkService,
		PDFViewer,
		ScrollMode: { HORIZONTAL: 1, VERTICAL: 0 },
	};
});

const { PdfDocumentViewer } = await import("./pdf-viewer");

beforeEach(() => {
	viewerMock.constructorOptions.length = 0;
	viewerMock.instances.length = 0;
	viewerMock.getDocument.mockClear();
	viewerMock.loadingTask.destroy.mockClear();
	viewerMock.pdfDocument.destroy.mockClear();
	viewerMock.page.getAnnotations.mockReset();
	viewerMock.page.getAnnotations.mockResolvedValue([]);
});

describe("PdfDocumentViewer", () => {
	it("uses PDF.js viewer scaling and disposes the document lifecycle", async () => {
		const onRenderSuccess = vi.fn();
		const view = render(
			<PdfDocumentViewer file={new Blob(["%PDF"])} pageScale={1} onRenderSuccess={onRenderSuccess} />,
		);

		await waitFor(() => expect(viewerMock.instances).toHaveLength(1));
		const [instance] = viewerMock.instances;
		const [{ abortSignal }] = viewerMock.constructorOptions;

		expect(instance.currentScaleValue).toBe("0.75");
		expect(onRenderSuccess).toHaveBeenCalledTimes(1);

		view.unmount();
		expect(abortSignal?.aborted).toBe(true);
		expect(instance.setDocument).toHaveBeenLastCalledWith(null);
		expect(viewerMock.pdfDocument.destroy).toHaveBeenCalledTimes(1);
		expect(viewerMock.loadingTask.destroy).toHaveBeenCalledTimes(1);
	});

	it("positions builder overlays from the rendered PDF.js page viewport", async () => {
		viewerMock.page.getAnnotations.mockResolvedValue([
			{
				rect: [10, 20, 90, 60],
				subtype: "Link",
				url: "https://resume-section.invalid/summary",
			},
		]);

		const view = render(
			<PdfDocumentViewer
				file={new Blob(["%PDF"])}
				showPageNumbers
				renderSectionOverlay={(marker) => <span data-testid="overlay">{marker.sectionId}</span>}
			/>,
		);

		await waitFor(() => expect(view.getByTestId("overlay")).toHaveTextContent("summary"));
		expect(view.getByLabelText("Resume page 1 of 1")).toHaveTextContent("Page 1 of 1");
	});

	it("exposes scrollToSection via ref and scrolls the container to the marker", async () => {
		viewerMock.page.getAnnotations.mockResolvedValue([
			{
				rect: [0, 0, 10, 10],
				subtype: "Link",
				url: "https://resume-section.invalid/experience",
			},
		]);

		const scrollContainer = window.document.createElement("div");
		const scrollTo = vi.fn();
		scrollContainer.scrollTo = scrollTo;
		const ref = createRef<{ scrollToSection: (sectionId: string, onScrolled?: () => void) => boolean }>();

		const view = render(
			<PdfDocumentViewer
				ref={ref}
				file={new Blob(["%PDF"])}
				scrollContainerRef={{ current: scrollContainer }}
				renderSectionOverlay={(marker) => <span data-testid="overlay">{marker.sectionId}</span>}
			/>,
		);

		await waitFor(() => expect(view.getByTestId("overlay")).toHaveTextContent("experience"));

		const root = view.container.querySelector(".resume-pdf-viewer");
		expect(root).not.toBeNull();
		vi.spyOn(root as HTMLElement, "getBoundingClientRect").mockReturnValue({ top: 100 } as DOMRect);
		vi.spyOn(scrollContainer, "getBoundingClientRect").mockReturnValue({ top: 50 } as DOMRect);
		scrollContainer.scrollTop = 0;

		expect(ref.current?.scrollToSection("experience")).toBe(true);
		expect(scrollTo).toHaveBeenCalledWith({ top: 34, behavior: "auto" });
	});

	it("fulfills a pending section request after PDF markers become available", async () => {
		let resolveAnnotations: (annotations: AnnotationFixture[]) => void = () => undefined;
		viewerMock.page.getAnnotations.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveAnnotations = resolve;
				}),
		);

		const scrollContainer = window.document.createElement("div");
		const scrollTo = vi.fn();
		const onScrolled = vi.fn();
		scrollContainer.scrollTo = scrollTo;
		const ref = createRef<{ scrollToSection: (sectionId: string, onScrolled?: () => void) => boolean }>();

		const view = render(
			<PdfDocumentViewer
				ref={ref}
				file={new Blob(["%PDF"])}
				scrollContainerRef={{ current: scrollContainer }}
				renderSectionOverlay={(marker) => <span data-testid="overlay">{marker.sectionId}</span>}
			/>,
		);

		await waitFor(() => expect(ref.current).not.toBeNull());
		expect(ref.current?.scrollToSection("projects", onScrolled)).toBe(false);

		const root = view.container.querySelector(".resume-pdf-viewer") as HTMLElement;
		vi.spyOn(root, "getBoundingClientRect").mockReturnValue({ top: 100 } as DOMRect);
		vi.spyOn(scrollContainer, "getBoundingClientRect").mockReturnValue({ top: 50 } as DOMRect);

		await act(async () => {
			resolveAnnotations([
				{
					rect: [0, 0, 10, 10],
					subtype: "Link",
					url: "https://resume-section.invalid/projects",
				},
			]);
		});

		await waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ top: 34, behavior: "auto" }));
		expect(onScrolled).toHaveBeenCalledTimes(1);
	});
});
