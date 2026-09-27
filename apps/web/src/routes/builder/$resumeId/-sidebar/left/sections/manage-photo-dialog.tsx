import type { Area, Point } from "react-easy-crop";
import type { PictureShapeId } from "./picture-shapes";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { CheckIcon, ImageIcon, ImagesIcon, TrashSimpleIcon } from "@phosphor-icons/react";
import { useId, useState } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@headcv/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@headcv/ui/components/dialog";
import { Slider } from "@headcv/ui/components/slider";
import { cn } from "@headcv/utils/style";
import { getPictureShapeLabel, PICTURE_SHAPES } from "./picture-shapes";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
// The server downsizes uploads to 800px; a little headroom keeps the crop sharp after resampling.
const MAX_OUTPUT_SIZE = 1200;

export type ManagePhotoResult = { blob: Blob; aspectRatio: number; borderRadius: number };

/** Mounted only while open and keyed per photo, so each opened or replaced photo starts centred and unzoomed. */
type ManagePhotoDialogProps = {
	onOpenChange: (open: boolean) => void;
	src: string;
	initialShape: PictureShapeId;
	isSaving: boolean;
	canRemove: boolean;
	onSave: (result: ManagePhotoResult) => void;
	onReplace: () => void;
	onRemove: () => void;
};

export default function ManagePhotoDialog({
	onOpenChange,
	src,
	initialShape,
	isSaving,
	canRemove,
	onSave,
	onReplace,
	onRemove,
}: ManagePhotoDialogProps) {
	const zoomLabelId = useId();
	const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(MIN_ZOOM);
	const [shapeId, setShapeId] = useState<PictureShapeId>(initialShape);
	const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
	const [isCropping, setIsCropping] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const shape = PICTURE_SHAPES.find((item) => item.id === shapeId) ?? PICTURE_SHAPES[0];
	const busy = isSaving || isCropping;

	const handleSave = async () => {
		if (!croppedAreaPixels) return;
		setIsCropping(true);
		setError(null);
		try {
			const blob = await cropImage(src, croppedAreaPixels);
			onSave({ blob, aspectRatio: shape.aspectRatio, borderRadius: shape.borderRadius });
		} catch {
			setError(t`This photo could not be processed. Try another image.`);
		} finally {
			setIsCropping(false);
		}
	};

	return (
		<Dialog open onOpenChange={(next) => !busy && onOpenChange(next)}>
			<DialogContent className="gap-5 sm:max-w-2xl md:max-w-2xl lg:max-w-2xl xl:max-w-2xl">
				<DialogTitle className="font-semibold text-lg">
					<Trans>Manage Photo</Trans>
				</DialogTitle>
				<DialogDescription className="sr-only">
					<Trans>Crop, zoom and choose the shape of your resume photo.</Trans>
				</DialogDescription>

				<div className="space-y-2">
					<div className="relative h-72 overflow-hidden rounded-lg bg-black sm:h-96">
						<Cropper
							image={src}
							crop={crop}
							zoom={zoom}
							minZoom={MIN_ZOOM}
							maxZoom={MAX_ZOOM}
							aspect={shape.aspectRatio}
							cropShape={shape.id === "circle" ? "round" : "rect"}
							showGrid={false}
							onCropChange={setCrop}
							onZoomChange={setZoom}
							onCropComplete={(_area, areaPixels) => setCroppedAreaPixels(areaPixels)}
							mediaProps={{ alt: "" }}
						/>
					</div>
					<p className="text-center text-muted-foreground text-xs">
						<Trans>Drag photo to reposition</Trans>
					</p>
				</div>

				<div className="grid grid-cols-1 gap-6 sm:grid-cols-[minmax(0,1fr)_13rem] sm:items-start">
					<div className="space-y-5">
						<div className="space-y-2">
							<p id={zoomLabelId} className="font-semibold text-sm">
								<Trans>Zoom</Trans>
							</p>
							<div className="flex items-center gap-3">
								<ImageIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
								<Slider
									aria-labelledby={zoomLabelId}
									min={MIN_ZOOM}
									max={MAX_ZOOM}
									step={0.01}
									value={[zoom]}
									onValueChange={(value) => setZoom(Array.isArray(value) ? value[0] : value)}
								/>
								<ImageIcon className="size-6 shrink-0 text-muted-foreground" aria-hidden="true" />
							</div>
						</div>

						<fieldset>
							<legend className="mb-2 font-semibold text-sm">
								<Trans>Shape</Trans>
							</legend>
							<div className="grid grid-cols-5 gap-2">
								{PICTURE_SHAPES.map((item) => {
									const selected = item.id === shape.id;
									return (
										<button
											key={item.id}
											type="button"
											aria-pressed={selected}
											onClick={() => setShapeId(item.id)}
											className="flex flex-col items-center gap-1.5 rounded-lg p-1 text-center font-medium text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
										>
											<span
												className={cn(
													"flex size-10 items-center justify-center rounded-lg border bg-secondary transition-colors",
													selected ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground",
												)}
											>
												<span
													className={cn(
														"border-2 border-current",
														item.aspectRatio < 1 ? "h-6 w-4.5" : "size-5",
														item.className,
													)}
												/>
											</span>
											<span className="leading-tight">{getPictureShapeLabel(item.id)}</span>
										</button>
									);
								})}
							</div>
						</fieldset>
					</div>

					<div className="flex flex-col gap-2">
						<Button size="lg" disabled={!croppedAreaPixels || busy} onClick={() => void handleSave()}>
							<CheckIcon aria-hidden="true" />
							{busy ? <Trans>Saving…</Trans> : <Trans>Save</Trans>}
						</Button>
						<Button size="lg" variant="outline" disabled={busy} onClick={onReplace}>
							<ImagesIcon aria-hidden="true" />
							<Trans>Replace Photo</Trans>
						</Button>
						{canRemove && (
							<Button
								size="lg"
								variant="outline"
								disabled={busy}
								className="text-destructive hover:text-destructive"
								onClick={onRemove}
							>
								<TrashSimpleIcon aria-hidden="true" />
								<Trans>Remove Photo</Trans>
							</Button>
						)}
						{error && (
							<p role="alert" className="text-destructive text-xs">
								{error}
							</p>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.crossOrigin = "anonymous";
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error("Failed to load image"));
		image.src = src;
	});
}

/** Bakes the visible crop into a JPEG so templates, PDF and DOCX keep using a plain image URL. */
async function cropImage(src: string, area: Area): Promise<Blob> {
	const image = await loadImage(src);
	const scale = Math.min(1, MAX_OUTPUT_SIZE / Math.max(area.width, area.height));
	const canvas = document.createElement("canvas");
	canvas.width = Math.max(1, Math.round(area.width * scale));
	canvas.height = Math.max(1, Math.round(area.height * scale));

	const context = canvas.getContext("2d");
	if (!context) throw new Error("Canvas is not supported");

	// JPEG has no alpha channel; flatten transparent PNGs onto white instead of black.
	context.fillStyle = "white";
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.imageSmoothingQuality = "high";
	context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);

	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Failed to crop image"))), "image/jpeg", 0.92);
	});
}
