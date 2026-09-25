import type z from "zod";
import type { DialogProps } from "@/dialogs/store";
import { Trans } from "@lingui/react/macro";
import { PencilSimpleLineIcon, PlusIcon } from "@phosphor-icons/react";
import { useStore } from "@tanstack/react-form";
import { projectItemSchema } from "@headcv/schema/resume/data";
import { Button } from "@headcv/ui/components/button";
import {
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@headcv/ui/components/dialog";
import { FormControl, FormItem, FormLabel, FormMessage } from "@headcv/ui/components/form";
import { Switch } from "@headcv/ui/components/switch";
import { hydrateDateRange, prepareDateRangeForSave } from "@headcv/utils/date";
import { MonthInput } from "@/components/input/month-input";
import { RichInput } from "@/components/input/rich-input";
import { URLInput } from "@/components/input/url-input";
import { SectionTips } from "@/components/section-tips";
import { useDialogStore } from "@/dialogs/store";
import { useUpdateResumeData } from "@/features/resume/builder/draft";
import { useFormBlocker } from "@/hooks/use-form-blocker";
import { makeSectionItem } from "@/libs/resume/make-section-item";
import { createSectionItem, updateSectionItem } from "@/libs/resume/section-actions";
import { useInlineAppForm, withForm } from "@/libs/tanstack-form";

const formSchema = projectItemSchema;

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
	id: "",
	hidden: false,
	name: "",
	startDate: "",
	endDate: "",

	website: { url: "", label: "", inlineLink: false },
	description: "",
};

export function CreateProjectDialog({ data }: DialogProps<"resume.sections.projects.create">) {
	const closeDialog = useDialogStore((state) => state.closeDialog);
	const updateResumeData = useUpdateResumeData();
	const initialValues: FormValues = hydrateDateRange(makeSectionItem(defaultValues, data?.item));

	const form = useInlineAppForm({
		defaultValues: initialValues,
		validators: { onSubmit: formSchema },
		onSubmit: async ({ value }) => {
			const canonicalValue = prepareDateRangeForSave(value, initialValues);
			updateResumeData((draft) => {
				createSectionItem(draft, "projects", canonicalValue, data?.customSectionId);
			});
			closeDialog();
		},
	});

	const { requestClose } = useFormBlocker(form);
	const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle className="flex items-center gap-x-2">
					<PlusIcon />
					<Trans>Create a new project</Trans>
				</DialogTitle>
				<DialogDescription />
			</DialogHeader>

			<form
				className="grid gap-4 sm:grid-cols-2"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<ProjectForm form={form} />

				<DialogFooter className="sm:col-span-full">
					<Button variant="ghost" onClick={requestClose}>
						<Trans>Cancel</Trans>
					</Button>

					<Button type="submit" disabled={isSubmitting}>
						<Trans>Create</Trans>
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	);
}

export function UpdateProjectDialog({ data }: DialogProps<"resume.sections.projects.update">) {
	const closeDialog = useDialogStore((state) => state.closeDialog);
	const updateResumeData = useUpdateResumeData();
	const initialValues: FormValues = hydrateDateRange(data.item);

	const form = useInlineAppForm({
		defaultValues: initialValues,
		validators: { onSubmit: formSchema },
		onSubmit: async ({ value }) => {
			const canonicalValue = prepareDateRangeForSave(value, initialValues);
			updateResumeData((draft) => {
				updateSectionItem(draft, "projects", canonicalValue, data?.customSectionId);
			});
			closeDialog();
		},
	});

	const { requestClose } = useFormBlocker(form);
	const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle className="flex items-center gap-x-2">
					<PencilSimpleLineIcon />
					<Trans>Update an existing project</Trans>
				</DialogTitle>
				<DialogDescription />
			</DialogHeader>

			<form
				className="grid gap-4 sm:grid-cols-2"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<ProjectForm form={form} />

				<DialogFooter className="sm:col-span-full">
					<Button variant="ghost" onClick={requestClose}>
						<Trans>Cancel</Trans>
					</Button>

					<Button type="submit" disabled={isSubmitting}>
						<Trans>Save Changes</Trans>
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	);
}

const ProjectForm = withForm({
	defaultValues,
	render: function ProjectFormRenderer({ form }) {
		const inlineLink = useStore(form.store, (s) => s.values.website.inlineLink);

		return (
			<>
				<form.AppField name="name">{(field) => <field.TextField label={<Trans>Name</Trans>} />}</form.AppField>

				<form.Field name="startDate">
					{(field) => (
						<FormItem>
							<FormLabel>
								<Trans>Start Date</Trans>
							</FormLabel>
							<FormControl
								render={
									<MonthInput
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
								}
							/>
							<FormMessage errors={field.state.meta.errors} />
						</FormItem>
					)}
				</form.Field>

				<form.Field name="endDate">
					{(field) => (
						<FormItem>
							<FormLabel>
								<Trans>End Date</Trans>
							</FormLabel>
							<FormControl
								render={
									<MonthInput
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
								}
							/>
							<FormMessage errors={field.state.meta.errors} />
						</FormItem>
					)}
				</form.Field>

				<form.Field name="website">
					{(field) => (
						<FormItem
							className="sm:col-span-full"
							hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}
						>
							<FormLabel>
								<Trans>Website</Trans>
							</FormLabel>
							<URLInput
								value={field.state.value}
								onChange={(v) => field.handleChange(v)}
								hideLabelButton={inlineLink}
							/>
							<FormMessage errors={field.state.meta.errors} />
						</FormItem>
					)}
				</form.Field>

				<form.Field name="website.inlineLink">
					{(field) => (
						<FormItem className="flex items-center gap-x-2 sm:col-span-full">
							<FormControl
								render={
									<Switch
										checked={field.state.value}
										onCheckedChange={(checked: boolean) => {
											field.handleChange(checked);
										}}
									/>
								}
							/>
							<FormLabel className="mt-0!">
								<Trans>Show link in title</Trans>
							</FormLabel>
						</FormItem>
					)}
				</form.Field>

				<form.Field name="description">
					{(field) => (
						<FormItem
							className="sm:col-span-full"
							hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}
						>
							<FormLabel>
								<Trans>Description</Trans>
							</FormLabel>
							<FormControl render={<RichInput value={field.state.value} onChange={(v) => field.handleChange(v)} />} />
							<FormMessage errors={field.state.meta.errors} />
						</FormItem>
					)}
				</form.Field>

				<details className="space-y-3 pt-2 sm:col-span-full" data-inline-customizations>
					<summary className="cursor-pointer font-medium text-muted-foreground text-sm">
						<Trans>Show customizations for this section</Trans>
					</summary>
					<div className="space-y-3 rounded-md border bg-muted/20 p-3">
						<SectionTips type="projects" />
					</div>
				</details>
			</>
		);
	},
});
