import type { Picture } from "@headcv/schema/resume/data";
import type { ManagePhotoResult } from "./manage-photo-dialog";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { CameraIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@headcv/utils/style";
import { useCurrentResume, useUpdateResumeData } from "@/features/resume/builder/draft";
import { getReadableErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";
import { SectionBase } from "../shared/section-base";
import { getPictureShape } from "./picture-shapes";

// The cropper is only needed once a photo is picked, so keep it out of the builder bundle.
const ManagePhotoDialog = lazy(() => import("./manage-photo-dialog"));

export function PictureSectionBuilder() {
	return (
		<SectionBase type="picture">
			<PictureSectionForm />
		</SectionBase>
	);
}

function normalizePictureUrl(url: string, origin: string): string {
	if (!url) return url;
	if (url.startsWith("/uploads/")) return `/api${url}`;

	try {
		const parsed = new URL(url, origin);
		if (parsed.origin !== origin) return url;
		if (!parsed.pathname.startsWith("/uploads/")) return url;
		return `/api${parsed.pathname}${parsed.search}${parsed.hash}`;
	} catch {
		return url;
	}
}

async function createPicturePreviewUrl(url: string, signal: AbortSignal) {
	const response = await fetch(url, { signal });

	if (!response.ok) {
		throw new Error(`Failed to fetch image: ${response.status}`);
	}

	const blob = await response.blob();
	return URL.createObjectURL(blob);
}

type PictureSectionFormProps = {
	value?: Picture;
	onChange?: (value: Picture) => void;
};

export function PictureSectionForm({ value, onChange }: PictureSectionFormProps = {}) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const appOrigin = typeof window === "undefined" ? "" : window.location.origin;
	const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);

	const resume = useCurrentResume();
	const picture = value ?? resume.data.picture;
	const shape = getPictureShape(picture);
	const normalizedPictureUrl = normalizePictureUrl(picture.url, appOrigin);
	const picturePreviewQuery = useQuery({
		queryKey: ["resume-picture-preview", normalizedPictureUrl],
		queryFn: ({ signal }) => createPicturePreviewUrl(normalizedPictureUrl, signal),
		enabled: Boolean(normalizedPictureUrl),
		gcTime: 0,
	});
	const pictureSrc = picturePreviewQuery.data ?? normalizedPictureUrl;
	const updateResumeData = useUpdateResumeData();

	const { mutateAsync: uploadFile, isPending: isUploading } = useMutation(
		orpc.storage.uploadFile.mutationOptions({ meta: { noInvalidate: true } }),
	);
	const { mutate: deleteFile } = useMutation(orpc.storage.deleteFile.mutationOptions({ meta: { noInvalidate: true } }));

	const persist = (data: Picture) => {
		if (onChange) {
			onChange(data);
			return;
		}
		updateResumeData((draft) => {
			draft.picture = data;
		});
	};

	const openFilePicker = () => {
		fileInputRef.current?.click();
	};

	const closeDialog = () => {
		setDialogOpen(false);
		setSelectedFileUrl(null);
	};

	const onFileChosen = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			toast.error(t`Please choose an image file.`);
			return;
		}

		setSelectedFileUrl(URL.createObjectURL(file));
		setDialogOpen(true);
	};

	const onSave = async ({ blob, aspectRatio, borderRadius }: ManagePhotoResult) => {
		try {
			const { url } = await uploadFile(new File([blob], "picture.jpg", { type: "image/jpeg" }));
			persist({ ...picture, url, aspectRatio, borderRadius, hidden: false });
			closeDialog();
		} catch (error) {
			toast.error(
				getReadableErrorMessage(
					error,
					t({
						comment: "Fallback toast when uploading profile picture for resume fails",
						message: "Failed to upload picture. Please try again.",
					}),
				),
			);
		}
	};

	const onRemove = () => {
		if (!picture.url) return;

		const pictureUrl = new URL(picture.url, window.location.origin);
		const filename = pictureUrl.pathname.split("/").pop();

		// Defer storage deletion while editing a draft so Back remains non-destructive.
		if (!onChange && filename && pictureUrl.origin === window.location.origin) deleteFile({ filename });

		persist({ ...picture, url: "" });
		closeDialog();
	};

	useEffect(() => {
		const objectUrl = picturePreviewQuery.data;

		return () => {
			if (objectUrl) URL.revokeObjectURL(objectUrl);
		};
	}, [picturePreviewQuery.data]);

	useEffect(() => {
		return () => {
			if (selectedFileUrl) URL.revokeObjectURL(selectedFileUrl);
		};
	}, [selectedFileUrl]);

	const hasPicture = Boolean(picture.url);
	const dialogSrc = selectedFileUrl ?? (hasPicture ? pictureSrc : null);

	return (
		<div className="flex flex-col items-center gap-2">
			<span className="self-stretch text-center font-medium text-sm">
				<Trans>Photo</Trans>
			</span>

			<input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChosen} />

			<button
				type="button"
				onClick={hasPicture ? () => setDialogOpen(true) : openFilePicker}
				aria-label={hasPicture ? t`Manage photo` : t`Upload photo`}
				className={cn(
					"group/picture relative flex cursor-pointer items-center justify-center overflow-hidden bg-secondary text-muted-foreground outline-none transition-colors hover:bg-secondary/70 focus-visible:ring-3 focus-visible:ring-ring/50",
					shape.aspectRatio < 1 ? "h-32 w-24" : "size-32",
					shape.className,
				)}
			>
				{hasPicture && pictureSrc ? (
					<>
						<img
							alt=""
							src={pictureSrc}
							className={cn(
								"fade-in size-full animate-in object-cover transition-opacity group-hover/picture:opacity-40",
								picture.hidden && "opacity-50",
							)}
						/>
						<PencilSimpleIcon
							className="absolute size-6 text-foreground opacity-0 transition-opacity group-hover/picture:opacity-100"
							aria-hidden="true"
						/>
					</>
				) : (
					<CameraIcon className="size-10" aria-hidden="true" />
				)}
			</button>

			{dialogOpen && dialogSrc && (
				<Suspense fallback={null}>
					<ManagePhotoDialog
						key={selectedFileUrl ?? picture.url}
						src={dialogSrc}
						initialShape={shape.id}
						isSaving={isUploading}
						canRemove={hasPicture}
						onOpenChange={(open) => {
							if (!open) closeDialog();
						}}
						onSave={(result) => void onSave(result)}
						onReplace={openFilePicker}
						onRemove={onRemove}
					/>
				</Suspense>
			)}
		</div>
	);
}
