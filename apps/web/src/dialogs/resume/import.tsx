import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { DialogProps } from "../store";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { DownloadSimpleIcon, FileIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { useStore } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { JSONResumeImporter } from "@reactive-resume/import/json-resume";
import { ReactiveResumeJSONImporter } from "@reactive-resume/import/reactive-resume-json";
import { ReactiveResumeV4JSONImporter } from "@reactive-resume/import/reactive-resume-v4-json";
import { Button } from "@reactive-resume/ui/components/button";
import {
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@reactive-resume/ui/components/dialog";
import { FormControl, FormItem, FormLabel, FormMessage } from "@reactive-resume/ui/components/form";
import { Input } from "@reactive-resume/ui/components/input";
import { Spinner } from "@reactive-resume/ui/components/spinner";
import { cn } from "@reactive-resume/utils/style";
import { Combobox } from "@/components/ui/combobox";
import { useFormBlocker } from "@/hooks/use-form-blocker";
import { getOrpcErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";
import { useAppForm } from "@/libs/tanstack-form";
import { useDialogStore } from "../store";

const formSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal(""),
		file: z.undefined(),
	}),
	z.object({
		type: z.literal("reactive-resume-json"),
		file: z
			.instanceof(File)
			.refine((file) => file.type === "application/json", { message: "File must be a JSON file" }),
	}),
	z.object({
		type: z.literal("reactive-resume-v4-json"),
		file: z
			.instanceof(File)
			.refine((file) => file.type === "application/json", { message: "File must be a JSON file" }),
	}),
	z.object({
		type: z.literal("json-resume-json"),
		file: z
			.instanceof(File)
			.refine((file) => file.type === "application/json", { message: "File must be a JSON file" }),
	}),
]);

type FormValues = z.infer<typeof formSchema>;
type ImportType = FormValues["type"];

export function ImportResumeDialog(_: DialogProps<"resume.import">) {
	const navigate = useNavigate();
	const closeDialog = useDialogStore((state) => state.closeDialog);

	const prevTypeRef = useRef<string>("");
	const inputRef = useRef<HTMLInputElement>(null);
	const [isImporting, setIsImporting] = useState<boolean>(false);

	const { mutateAsync: importResume } = useMutation(orpc.resume.import.mutationOptions());

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
				description: t`This may take a few moments. Please do not close the window or refresh the page.`,
			});

			try {
				let data: ResumeData | undefined;

				if (value.type === "json-resume-json") {
					const json = await value.file.text();
					const importer = new JSONResumeImporter();
					data = importer.parse(json);
				}

				if (value.type === "reactive-resume-json") {
					const json = await value.file.text();
					const importer = new ReactiveResumeJSONImporter();
					data = importer.parse(json);
				}

				if (value.type === "reactive-resume-v4-json") {
					const json = await value.file.text();
					const importer = new ReactiveResumeV4JSONImporter();
					data = importer.parse(json);
				}

				if (!data) {
					throw new Error(
						t({
							comment: "Error shown when the selected import file could not be parsed",
							message: "No data could be parsed from the selected file.",
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
								comment: "Error shown when the imported file has an invalid resume structure",
								message: "The imported file could not be parsed into a valid resume.",
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
					<Trans>
						Continue where you left off by importing an existing resume you created using Reactive Resume or any another
						resume builder. Supported formats include JSON files from Reactive Resume and JSON Resume.
					</Trans>
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
												value: "reactive-resume-json",
												label: t({
													comment: "Import source option for current Reactive Resume JSON format",
													message: "Reactive Resume (JSON)",
												}),
											},
											{
												value: "reactive-resume-v4-json",
												label: t({
													comment: "Import source option for legacy Reactive Resume v4 JSON format",
													message: "Reactive Resume v4 (JSON)",
												}),
											},
											{
												value: "json-resume-json",
												label: t({
													comment: "Import source option for standard JSON Resume format",
													message: "JSON Resume",
												}),
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
								<Input type="file" className="hidden" ref={inputRef} onChange={onUploadFile} />

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
