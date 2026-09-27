// @vitest-environment happy-dom

import type { Picture } from "@headcv/schema/resume/data";
import type { ManagePhotoResult } from "./manage-photo-dialog";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mocks = vi.hoisted(() => ({
	upload: vi.fn(),
	deleteFile: vi.fn(),
	updateResumeData: vi.fn(),
	toastError: vi.fn(),
	picture: null as unknown as Picture,
}));

vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => ({ data: { picture: mocks.picture } }),
	useUpdateResumeData: () => mocks.updateResumeData,
}));
vi.mock("@/libs/orpc/client", () => ({
	orpc: {
		storage: {
			uploadFile: { mutationOptions: () => ({ mutationFn: mocks.upload }) },
			deleteFile: { mutationOptions: () => ({ mutationFn: mocks.deleteFile }) },
		},
	},
}));
vi.mock("sonner", () => ({ toast: { error: mocks.toastError, loading: vi.fn(), dismiss: vi.fn() } }));
vi.mock("../shared/section-base", () => ({ SectionBase: ({ children }: { children: React.ReactNode }) => children }));
// The real dialog needs canvas + pointer geometry; this stand-in exposes its contract to the form.
vi.mock("./manage-photo-dialog", () => ({
	default: ({
		initialShape,
		canRemove,
		onSave,
		onRemove,
	}: {
		initialShape: string;
		canRemove: boolean;
		onSave: (result: ManagePhotoResult) => void;
		onRemove: () => void;
	}) => (
		<div role="dialog" aria-label="Manage Photo">
			<p>Initial shape: {initialShape}</p>
			<button
				type="button"
				onClick={() => onSave({ blob: new Blob(["cropped"]), aspectRatio: 0.75, borderRadius: 10 })}
			>
				Save rounded portrait
			</button>
			{canRemove && (
				<button type="button" onClick={onRemove}>
					Remove Photo
				</button>
			)}
		</div>
	),
}));

const { PictureSectionForm } = await import("./picture");

const uploadUrl = (filename: string) =>
	new URL(`/api/uploads/user-1/pictures/${filename}`, window.location.origin).href;

const basePicture: Picture = {
	hidden: false,
	url: "",
	size: 80,
	rotation: 0,
	aspectRatio: 1,
	borderRadius: 0,
	borderColor: "rgba(0, 0, 0, 0.5)",
	borderWidth: 0,
	shadowColor: "rgba(0, 0, 0, 0.5)",
	shadowWidth: 0,
};

beforeAll(() => i18n.loadAndActivate({ locale: "en", messages: {} }));

beforeEach(() => {
	vi.clearAllMocks();
	mocks.picture = { ...basePicture };
	mocks.upload.mockResolvedValue({ url: uploadUrl("2.jpeg") });
	vi.stubGlobal(
		"fetch",
		vi.fn(async () => new Response(new Blob(["image"]))),
	);
	vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:selected-photo");
	vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

function renderPicture(props: React.ComponentProps<typeof PictureSectionForm> = {}) {
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
	const view = render(
		<QueryClientProvider client={queryClient}>
			<I18nProvider i18n={i18n}>
				<PictureSectionForm {...props} />
			</I18nProvider>
		</QueryClientProvider>,
	);
	const fileInput = view.container.querySelector<HTMLInputElement>('input[type="file"]');
	if (!fileInput) throw new Error("file input missing");
	return { ...view, fileInput };
}

function applyStoreUpdate() {
	const draft = { picture: { ...mocks.picture } };
	const updater = mocks.updateResumeData.mock.calls.at(-1)?.[0] as (value: typeof draft) => void;
	updater(draft);
	return draft.picture;
}

describe("PictureSectionForm", () => {
	it("offers only a photo tile, without the URL field or advanced customizations", () => {
		renderPicture();
		expect(screen.getByRole("button", { name: "Upload photo" })).toBeInTheDocument();
		expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
		expect(screen.queryByText("Photo customizations")).not.toBeInTheDocument();
		expect(screen.queryByText("Border Width")).not.toBeInTheDocument();
	});

	it("opens Manage Photo after choosing an image and saves the cropped upload with its shape", async () => {
		const onChange = vi.fn();
		const { fileInput } = renderPicture({ value: { ...basePicture, hidden: true }, onChange });

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		await userEvent.upload(fileInput, new File(["photo"], "me.png", { type: "image/png" }));
		expect(await screen.findByRole("dialog", { name: "Manage Photo" })).toBeInTheDocument();
		expect(mocks.upload).not.toHaveBeenCalled();

		await userEvent.click(screen.getByRole("button", { name: "Save rounded portrait" }));

		const uploaded = mocks.upload.mock.calls[0][0] as File;
		expect(uploaded).toBeInstanceOf(File);
		expect(uploaded.type).toBe("image/jpeg");
		expect(onChange).toHaveBeenCalledWith({
			...basePicture,
			url: uploadUrl("2.jpeg"),
			aspectRatio: 0.75,
			borderRadius: 10,
			hidden: false,
		});
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("rejects non-image files without opening the dialog", async () => {
		const { fileInput } = renderPicture();
		await userEvent.upload(fileInput, new File(["text"], "notes.txt", { type: "text/plain" }), { applyAccept: false });
		expect(mocks.toastError).toHaveBeenCalledWith("Please choose an image file.");
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("keeps the dialog open and reports an error when the upload fails", async () => {
		mocks.upload.mockRejectedValue(new Error("offline"));
		const { fileInput } = renderPicture();
		await userEvent.upload(fileInput, new File(["photo"], "me.png", { type: "image/png" }));
		await userEvent.click(await screen.findByRole("button", { name: "Save rounded portrait" }));

		expect(mocks.toastError).toHaveBeenCalledOnce();
		expect(mocks.updateResumeData).not.toHaveBeenCalled();
		expect(screen.getByRole("dialog", { name: "Manage Photo" })).toBeInTheDocument();
	});

	it("reopens an existing photo in its saved shape and removes it from storage", async () => {
		mocks.picture = {
			...basePicture,
			url: uploadUrl("1.jpeg"),
			aspectRatio: 1,
			borderRadius: 100,
		};
		renderPicture();

		await userEvent.click(screen.getByRole("button", { name: "Manage photo" }));
		expect(await screen.findByText("Initial shape: circle")).toBeInTheDocument();

		await userEvent.click(screen.getByRole("button", { name: "Remove Photo" }));
		expect(mocks.deleteFile.mock.calls[0][0]).toEqual({ filename: "1.jpeg" });
		expect(applyStoreUpdate().url).toBe("");
	});

	it("defers storage deletion while editing a draft so Back stays non-destructive", async () => {
		const onChange = vi.fn();
		renderPicture({ value: { ...basePicture, url: uploadUrl("1.jpeg") }, onChange });

		await userEvent.click(screen.getByRole("button", { name: "Manage photo" }));
		await userEvent.click(await screen.findByRole("button", { name: "Remove Photo" }));

		expect(mocks.deleteFile).not.toHaveBeenCalled();
		expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ url: "" }));
	});
});
