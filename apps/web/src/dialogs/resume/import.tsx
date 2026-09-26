import type { ResumeData } from "@headcv/schema/resume/data";
import type { DialogProps } from "../store";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { DownloadSimpleIcon, FileIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { useStore } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { Badge } from "@headcv/ui/components/badge";
import { Button } from "@headcv/ui/components/button";
import {
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@headcv/ui/components/dialog";
import { FormControl, FormItem, FormLabel, FormMessage } from "@headcv/ui/components/form";
import { Input } from "@headcv/ui/components/input";
import { Spinner } from "@headcv/ui/components/spinner";
import { cn } from "@headcv/utils/style";
import { Combobox } from "@/components/ui/combobox";
import { useFormBlocker } from "@/hooks/use-form-blocker";
import { getOrpcErrorMessage } from "@/libs/error-message";
import { client, orpc } from "@/libs/orpc/client";
import { useAppForm } from "@/libs/tanstack-form";
import { useDialogStore } from "../store";

const formSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal(""),
		file: z.undefined(),
	}),
	z.object({
		type: z.literal("pdf"),
		file: z.instanceof(File).refine((file) => file.type === "application/pdf", { message: "File must be a PDF" }),
	}),
	z.object({
		type: z.literal("docx"),
		file: z
			.instanceof(File)
			.refine(
				(file) =>
					file.type === "application/msword" ||
					file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				{ message: "File must be a Microsoft Word document" },
			),
	}),
]);

type FormValues = z.infer<typeof formSchema>;
type ImportType = FormValues["type"];

// Only PDF and Microsoft Word are offered; the picker filters to the chosen type.
const ACCEPTED_FILES: Record<ImportType, string | undefined> = {
	"": undefined,
	pdf: ".pdf,application/pdf",
	docx: ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result as string;
			// remove data URL prefix (e.g., "data:application/pdf;base64," or "data:application/vnd...;base64,")
			resolve(result.split(",")[1]);
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

export function ImportResumeDialog(_: DialogProps<"resume.import">) {
	const navigate = useNavigate();
	const closeDialog = useDialogStore((state) => state.closeDialog);

	const prevTypeRef = useRef<string>("");
	const inputRef = useRef<HTMLInputElement>(null);
	const [isImporting, setIsImporting] = useState<boolean>(false);

	const { mutateAsync: importResume } = useMutation(orpc.resume.import.mutationOptions());
	const { data: aiProviders, isLoading: isLoadingAiProviders } = useQuery(orpc.aiProviders.list.queryOptions());
	const hasAIProvider = aiProviders?.some((provider) => provider.enabled && provider.testStatus === "success") ?? false;

	const form = useAppForm({
		defaultValues: {
			type: "" as ImportType,
			file: undefined as File | undefined,
		},
		validators: { onSubmit: formSchema },
		onSubmit: async ({ value }) => {
			if (value.type === "" || !value.file) return;

			setIsImporting(true);

			const toastId = toast.loading(t`Importing your resume...`, {
				description: t`loading....`,
			});

			try {
				let data: ResumeData | undefined;

				if (value.type === "pdf") {
					if (isLoadingAiProviders) throw new Error(t`Loading AI providers. Please try again in a moment.`);
					if (!hasAIProvider)
						throw new Error(t`This feature requires a tested AI provider. Please add one in the settings.`);

					const base64 = await fileToBase64(value.file);

					data = await client.ai.parsePdf({
						file: { name: value.file.name, data: base64 },
					});
				}

				if (value.type === "docx") {
					if (isLoadingAiProviders) throw new Error(t`Loading AI providers. Please try again in a moment.`);
					if (!hasAIProvider)
						throw new Error(t`This feature requires a tested AI provider. Please add one in the settings.`);

					const base64 = await fileToBase64(value.file);

					const mediaType =
						value.file.type === "application/msword"
							? ("application/msword" as const)
							: ("application/vnd.openxmlformats-officedocument.wordprocessingml.document" as const);

					data = await client.ai.parseDocx({
						mediaType,
						file: { name: value.file.name, data: base64 },
					});
				}

				if (!data) {
					throw new Error(
						t({
							comment: "Error shown when AI import endpoint returns no parsed resume data",
							message: "No data was returned from the AI provider.",
						}),
					);
				}

				const id = await importResume({ data });
				toast.success(t`Your resume has been imported successfully.`, { id: toastId, description: null });
				closeDialog();
				void navigate({ to: "/builder/$resumeId", params: { resumeId: id } });
			} catch (error: unknown) {
				toast.error(
					getOrpcErrorMessage(error, {
						byCode: {
							BAD_REQUEST: t({
								comment: "Error shown when AI parsing returns invalid resume structure during import",
								message: "The imported file could not be parsed into a valid resume.",
							}),
							BAD_GATEWAY: t({
								comment: "Error shown when AI provider is unreachable during PDF/DOCX resume import",
								message: "Could not reach the AI provider. Please try again.",
							}),
						},
						fallback: t({
							comment: "Fallback toast when importing a resume fails for an unknown reason",
							message: "An unknown error occurred while importing your resume.",
						}),
					}),
					{ id: toastId, description: null },
				);
			} finally {
				setIsImporting(false);
			}
		},
	});

	const type = useStore(form.store, (s) => s.values.type);

	useEffect(() => {
		if (prevTypeRef.current === type) return;
		prevTypeRef.current = type;
		form.setFieldValue("file", undefined);
	}, [form, type]);

	const onSelectFile = () => {
		if (!inputRef.current) return;
		inputRef.current.click();
	};

	const onUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		form.setFieldValue("file", file);
	};

	useFormBlocker(form);

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle className="flex items-center gap-x-2">
					<DownloadSimpleIcon />
					<Trans>Import an existing resume</Trans>
				</DialogTitle>
				<DialogDescription>
					<Trans>Continue where you left off by importing an existing resume from a PDF or Microsoft Word file.</Trans>
				</DialogDescription>
			</DialogHeader>

			<form
				className="space-y-4"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<form.Field name="type">
					{(field) => (
						<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
							<FormLabel>
								<Trans>Type</Trans>
							</FormLabel>
							<FormControl
								render={
									<Combobox
										showClear={false}
										value={field.state.value}
										onValueChange={(value) => {
											field.handleChange(value as ImportType);
										}}
										options={[
											{
												value: "pdf",
												label: (
													<div className="flex items-center gap-x-2">
														{t({
															comment: "File format label in import source selector",
															message: "PDF",
														})}{" "}
														<Badge>{t`AI`}</Badge>
													</div>
												),
											},
											{
												value: "docx",
												label: (
													<div className="flex items-center gap-x-2">
														{t({
															comment: "File format label in import source selector",
															message: "Microsoft Word",
														})}{" "}
														<Badge>{t`AI`}</Badge>
													</div>
												),
											},
										]}
									/>
								}
							/>
							<FormMessage errors={field.state.meta.errors} />
						</FormItem>
					)}
				</form.Field>

				<form.Field key={type} name="file">
					{(field) => (
						<FormItem
							className={cn(!type && "hidden")}
							hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}
						>
							<FormControl>
								<Input
									type="file"
									accept={ACCEPTED_FILES[type]}
									className="hidden"
									ref={inputRef}
									onChange={onUploadFile}
								/>

								<Button
									variant="outline"
									className="h-auto w-full flex-col border-dashed py-8 font-normal"
									onClick={onSelectFile}
								>
									{field.state.value ? (
										<>
											<FileIcon weight="thin" size={32} />
											<p>{field.state.value.name}</p>
										</>
									) : (
										<>
											<UploadSimpleIcon weight="thin" size={32} />
											<Trans>Click here to select a file to import</Trans>
										</>
									)}
								</Button>
							</FormControl>
							<FormMessage errors={field.state.meta.errors} />
						</FormItem>
					)}
				</form.Field>

				<DialogFooter>
					<Button type="submit" disabled={!type || isImporting}>
						{isImporting ? <Spinner /> : null}
						{isImporting ? t`Importing…` : t`Import`}
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	);
}
