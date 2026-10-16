import type { RoleItem } from "@headcv/schema/resume/data";
import type z from "zod";
import type { DialogProps } from "@/dialogs/store";
import { Trans } from "@lingui/react/macro";
import { PencilSimpleLineIcon, PlusIcon, RowsIcon, TrashSimpleIcon } from "@phosphor-icons/react";
import { useStore } from "@tanstack/react-form";
import { AnimatePresence, Reorder, useDragControls } from "motion/react";
import { experienceItemSchema } from "@headcv/schema/resume/data";
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
import { generateId } from "@headcv/utils/string";
import { MonthInput } from "@/components/input/month-input";
import { RichInput } from "@/components/input/rich-input";
import { URLInput } from "@/components/input/url-input";
import { PhrasePicker } from "@/components/phrase-picker";
import { SectionTips } from "@/components/section-tips";
import { useDialogStore } from "@/dialogs/store";
import { useCurrentResume, useUpdateResumeData } from "@/features/resume/builder/draft";
import { useFormBlocker } from "@/hooks/use-form-blocker";
import { makeSectionItem } from "@/libs/resume/make-section-item";
import { createSectionItem, updateSectionItem } from "@/libs/resume/section-actions";
import { useInlineAppForm, withForm } from "@/libs/tanstack-form";

const formSchema = experienceItemSchema;

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
	id: "",
	hidden: false,
	company: "",
	position: "",
	location: "",
	startDate: "",
	endDate: "",

	website: { url: "", label: "", inlineLink: false },
	description: "",
	roles: [] as RoleItem[],
};

function withStructuredDates(item: FormValues): FormValues {
	const hydratedItem = hydrateDateRange(item);
	return {
		...hydratedItem,
		roles: item.roles.map((role) => hydrateDateRange(role)),
	};
}

export function CreateExperienceDialog({ data }: DialogProps<"resume.sections.experience.create">) {
	const closeDialog = useDialogStore((state) => state.closeDialog);
	const updateResumeData = useUpdateResumeData();

	const form = useInlineAppForm({
		defaultValues: withStructuredDates(makeSectionItem(defaultValues, data?.item)),
		validators: { onSubmit: formSchema },
		onSubmit: async ({ value }) => {
			const canonicalValue = prepareDateRangeForSave(value);
			canonicalValue.roles = value.roles.map((role) => prepareDateRangeForSave(role));
			updateResumeData((draft) => {
				createSectionItem(draft, "experience", canonicalValue, data?.customSectionId);
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
					<Trans>Create a new experience</Trans>
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
				<ExperienceForm form={form} />

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

export function UpdateExperienceDialog({ data }: DialogProps<"resume.sections.experience.update">) {
	const closeDialog = useDialogStore((state) => state.closeDialog);
	const updateResumeData = useUpdateResumeData();
	const initialValues = withStructuredDates(data.item);

	const form = useInlineAppForm({
		defaultValues: initialValues,
		validators: { onSubmit: formSchema },
		onSubmit: async ({ value }) => {
			const canonicalValue = prepareDateRangeForSave(value, initialValues);
			canonicalValue.roles = value.roles.map((role) => {
				const initialRole = initialValues.roles.find((candidate) => candidate.id === role.id);
				return prepareDateRangeForSave(role, initialRole);
			});
			updateResumeData((draft) => {
				updateSectionItem(draft, "experience", canonicalValue, data?.customSectionId);
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
					<Trans>Edit Entry</Trans>
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
				<ExperienceForm form={form} />

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

const ExperienceForm = withForm({
	defaultValues,
	render: function ExperienceFormRenderer({ form }) {
		const inlineLink = useStore(form.store, (s) => s.values.website.inlineLink);
		const roles = useStore(form.store, (s) => s.values.roles);
		const hasRoles = roles.length > 0;

		const handleReorderRoles = (newOrder: RoleItem[]) => {
			form.setFieldValue("roles", newOrder);
		};

		return (
			<>
				<form.AppField name="company">{(field) => <field.TextField label={<Trans>Company</Trans>} />}</form.AppField>

				<form.AppField name="location">{(field) => <field.TextField label={<Trans>Location</Trans>} />}</form.AppField>

				<form.AppField name="position">{(field) => <field.TextField label={<Trans>Position</Trans>} />}</form.AppField>

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
										onValueChange={field.handleChange}
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
										onValueChange={field.handleChange}
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
							<FormLabel>
								<Trans>Show link in title</Trans>
							</FormLabel>
						</FormItem>
					)}
				</form.Field>

				{/* Role Progression */}
				<div className="flex items-center justify-between sm:col-span-full">
					<div className="space-y-1">
						<p className="font-medium text-foreground">
							<Trans>Role Progression</Trans>
						</p>
						<p className="text-muted-foreground text-xs">
							<Trans>Add multiple roles to show career progression at the same company.</Trans>
						</p>
					</div>

					<Button
						size="sm"
						variant="outline"
						className="shrink-0"
						onClick={() => {
							form.pushFieldValue("roles", {
								id: generateId(),
								position: "",

								startDate: "",
								endDate: "",
								description: "",
							});
						}}
					>
						<PlusIcon />
						<Trans>Add Role</Trans>
					</Button>
				</div>

				{hasRoles && (
					<form.Field name="roles" mode="array">
						{(rolesField) => (
							<Reorder.Group
								axis="y"
								values={rolesField.state.value}
								onReorder={handleReorderRoles}
								className="flex flex-col gap-4 sm:col-span-full"
							>
								<AnimatePresence>
									{rolesField.state.value.map((role: RoleItem, index: number) => (
										<RoleFields
											key={role.id}
											form={form}
											role={role}
											index={index}
											onRemove={() => {
												rolesField.removeValue(index);
											}}
										/>
									))}
								</AnimatePresence>
							</Reorder.Group>
						)}
					</form.Field>
				)}

				{/* Single Role Description  only show when no roles are defined */}
				{!hasRoles && (
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
								<ExperienceTipsAndPhrases value={field.state.value} onChange={field.handleChange} />
								<FormMessage errors={field.state.meta.errors} />
							</FormItem>
						)}
					</form.Field>
				)}
			</>
		);
	},
});

const RoleFields = withForm({
	defaultValues,
	props: {
		role: {
			id: "",
			position: "",

			startDate: "",
			endDate: "",
			description: "",
		} as RoleItem,
		index: 0,
		onRemove: () => undefined,
	},
	render: function RoleFieldsRenderer({ form, role, index, onRemove }) {
		const controls = useDragControls();

		return (
			<Reorder.Item
				value={role}
				dragListener={false}
				dragControls={controls}
				initial={{ opacity: 1, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -10 }}
				className="relative grid rounded-md border sm:col-span-full sm:grid-cols-2"
			>
				<div className="col-span-full flex items-center justify-between rounded-t bg-border/30 px-2 py-1.5">
					<Button
						size="sm"
						variant="ghost"
						className="cursor-grab touch-none"
						onPointerDown={(e) => {
							e.preventDefault();
							controls.start(e);
						}}
					>
						<RowsIcon />
						<Trans>Reorder</Trans>
					</Button>

					<Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onRemove}>
						<TrashSimpleIcon />
						<Trans>Remove</Trans>
					</Button>
				</div>

				<div className="grid gap-4 p-4 sm:col-span-full sm:grid-cols-2">
					<form.AppField name={`roles[${index}].position`}>
						{(field) => <field.TextField label={<Trans>Position</Trans>} />}
					</form.AppField>

					<form.Field name={`roles[${index}].startDate`}>
						{(field) => (
							<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
								<FormLabel>
									<Trans>Start Date</Trans>
								</FormLabel>
								<FormControl
									render={
										<MonthInput
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onValueChange={field.handleChange}
										/>
									}
								/>
								<FormMessage errors={field.state.meta.errors} />
							</FormItem>
						)}
					</form.Field>

					<form.Field name={`roles[${index}].endDate`}>
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
											onValueChange={field.handleChange}
										/>
									}
								/>
								<FormMessage errors={field.state.meta.errors} />
							</FormItem>
						)}
					</form.Field>

					<form.Field name={`roles[${index}].description`}>
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
				</div>
			</Reorder.Item>
		);
	},
});

function ExperienceTipsAndPhrases({ value, onChange }: { value: string; onChange: (value: string) => void }) {
	const resume = useCurrentResume();
	const jobTitleId = resume.data.metadata.targetJobTitleId || undefined;
	const experienceLevel = resume.data.metadata.experienceLevel ?? "entry";
	const locale = "en";

	const handleInsert = (text: string) => {
		onChange(value ? `${value} <p>${text}</p>` : `<p>${text}</p>`);
	};

	return (
		<details className="space-y-3 pt-2" data-inline-customizations>
			<summary className="cursor-pointer font-medium text-muted-foreground text-sm">
				<Trans>Show customizations for this section</Trans>
			</summary>
			<div className="space-y-3 rounded-md border bg-muted/20 p-3">
				<div className="flex items-center justify-end">
					<PhrasePicker
						jobTitleId={jobTitleId}
						experienceLevel={experienceLevel}
						locale={locale}
						onInsert={handleInsert}
					/>
				</div>
				<SectionTips type="experience" />
			</div>
		</details>
	);
}
