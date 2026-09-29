import { beforeEach, describe, expect, it, vi } from "vitest";
import { installStaleChunkRecovery } from "./stale-chunk-recovery";

type PreloadErrorHandler = (event: { preventDefault: () => void }) => void;

const createFakeWindow = () => {
	const store = new Map<string, string>();
	let handler: PreloadErrorHandler | undefined;
	const reload = vi.fn();

	const win = {
		addEventListener: (type: string, listener: PreloadErrorHandler) => {
			if (type === "vite:preloadError") handler = listener;
		},
		location: { reload },
		sessionStorage: {
			getItem: (key: string) => store.get(key) ?? null,
			setItem: (key: string, value: string) => {
				store.set(key, value);
			},
		},
	} as unknown as Window;

	const firePreloadError = () => {
		const preventDefault = vi.fn();
		handler?.({ preventDefault });
		return { preventDefault };
	};

	return { win, reload, firePreloadError };
};

describe("installStaleChunkRecovery", () => {
	beforeEach(() => {
		vi.useRealTimers();
	});

	it("reloads once and prevents Vite's default throw on a stale preload error", () => {
		const { win, reload, firePreloadError } = createFakeWindow();
		installStaleChunkRecovery(win);

		const { preventDefault } = firePreloadError();

		expect(preventDefault).toHaveBeenCalledOnce();
		expect(reload).toHaveBeenCalledOnce();
	});

	it("does not reload again within the debounce window (no reload loop)", () => {
		vi.useFakeTimers();
		const { win, reload, firePreloadError } = createFakeWindow();
		installStaleChunkRecovery(win);

		firePreloadError();
		vi.advanceTimersByTime(2_000);
		const { preventDefault } = firePreloadError();

		expect(reload).toHaveBeenCalledOnce();
		expect(preventDefault).not.toHaveBeenCalled();
	});

	it("reloads again once the debounce window has elapsed", () => {
		vi.useFakeTimers();
		const { win, reload, firePreloadError } = createFakeWindow();
		installStaleChunkRecovery(win);

		firePreloadError();
		vi.advanceTimersByTime(10_001);
		firePreloadError();

		expect(reload).toHaveBeenCalledTimes(2);
	});
});
