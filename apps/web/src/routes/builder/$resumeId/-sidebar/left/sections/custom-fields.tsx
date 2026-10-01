import type { basicsSchema } from "@headcv/schema/resume/data";
import type { SocialLink } from "@headcv/schema/resume/social-links";
import type z from "zod";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { DotsSixVerticalIcon, LinkIcon, ListPlusIcon, XIcon } from "@phosphor-icons/react";
import { Reorder, useDragControls } from "motion/react";
import { useState } from "react";
import { socialLinks } from "@headcv/schema/resume/social-links";
import { Button } from "@headcv/ui/components/button";
import { FormControl, FormItem } from "@headcv/ui/components/form";
import { Input } from "@headcv/ui/components/input";
import { Label } from "@headcv/ui/components/label";
import { Popover, PopoverContent, PopoverTrigger } from "@headcv/ui/components/popover";
import { generateId } from "@headcv/utils/string";
import { IconPicker } from "@/components/input/icon-picker";
import { withForm } from "@/libs/tanstack-form";

type FormValues = z.infer<typeof basicsSchema>;
type CustomField = FormValues["customFields"][number];

const defaultValues: FormValues = {
	name: "",
	headline: "",
	email: "",
	phone: "",
	location: "",
	website: { url: "", label: "" },
	customFields: [],
};

export const CustomFieldsSection = withForm({
	defaultValues,
	render: ({ form }) => {
		return (
			<form.Field name="customFields" mode="array">
				{(customFieldsField) => (
					// The add button sits after the list so the <ul> only contains <li> items.
					<div className="space-y-4">
						<Reorder.Group
							className="touch-none space-y-4"
							values={customFieldsField.state.value}
							onReorder={(fields) => {
								customFieldsField.setValue(fields);
								void form.handleSubmit();
							}}
						>
							{customFieldsField.state.value.map((field: CustomField, index: number) => (
								<CustomFieldItem key={field.id} field={field}>
									<form.Field name={`customFields[${index}].icon`}>
										{(iconField) => (
											<FormItem className="shrink-0">
												<FormControl
													render={
														<IconPicker
															name={iconField.name}
															value={iconField.state.value}
															className="rounded-r-none! border-e-0!"
															onChange={(icon) => {
																iconField.handleChange(icon);
																void form.handleSubmit();
															}}
														/>
													}
												/>
											</FormItem>
										)}
									</form.Field>

									<form.Field name={`customFields[${index}].text`}>
										{(textField) => (
											<FormItem className="flex-1">
												<FormControl
													render={
														<Input
															aria-label={t`Custom field text`}
															name={textField.name}
															value={textField.state.value}
															className="rounded-l-none!"
															onChange={(e) => {
																textField.handleChange(e.target.value);
																void form.handleSubmit();
															}}
														/>
													}
												/>
											</FormItem>
										)}
									</form.Field>

									<form.Field name={`customFields[${index}].link`}>
										{(linkField) => (
											<Popover>
												<PopoverTrigger
													render={
														<Button size="icon" variant="ghost" className="ms-1" aria-label={t`Custom field link`}>
															<LinkIcon />
														</Button>
													}
												/>

												<PopoverContent align="center">
													<div className="flex flex-col gap-y-1.5">
														<Label htmlFor={linkField.name} className="text-muted-foreground text-xs">
															<Trans>Enter the URL to link to</Trans>
														</Label>

														<Input
															type="url"
															value={linkField.state.value}
															id={linkField.name}
															placeholder={t({
																comment: "Placeholder text for custom link URL field in resume builder",
																message: "Must start with https://",
															})}
															onChange={(e) => {
																linkField.handleChange(e.target.value);
																void form.handleSubmit();
															}}
														/>
													</div>
												</PopoverContent>
											</Popover>
										)}
									</form.Field>

									<Button
										size="icon"
										variant="ghost"
										aria-label={t`Remove custom field`}
										onClick={() => {
											customFieldsField.removeValue(index);
											void form.handleSubmit();
										}}
									>
										<XIcon />
									</Button>
								</CustomFieldItem>
							))}
						</Reorder.Group>
						<div className="flex flex-wrap gap-2">
							<Button
								variant="ghost"
								onClick={() => {
									customFieldsField.pushValue({ id: generateId(), icon: "acorn", text: "", link: "" });
									void form.handleSubmit();
								}}
							>
								<ListPlusIcon />
								<Trans>Add a custom field</Trans>
							</Button>
							<SocialLinkPicker
								onSelect={(link) => {
									customFieldsField.pushValue({ id: generateId(), icon: link.icon, text: link.label, link: "" });
									void form.handleSubmit();
								}}
							/>
						</div>
					</div>
				)}
			</form.Field>
		);
	},
});

type SocialLinkPickerProps = {
	onSelect: (link: SocialLink) => void;
};

export function SocialLinkPicker({ onSelect }: SocialLinkPickerProps) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const filteredLinks = socialLinks.filter((link) =>
		`${link.label} ${link.key}`.toLowerCase().includes(query.toLowerCase()),
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<Button type="button" variant="ghost">
						<LinkIcon />
						<Trans>Add a link</Trans>
					</Button>
				}
			/>
			<PopoverContent align="start" className="w-72 p-2">
				<Input
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder={t`Search links and social profiles`}
					aria-label={t`Search links and social profiles`}
				/>
				<div className="mt-2 max-h-64 overflow-y-auto">
					{filteredLinks.map((link) => (
						<Button
							key={link.key}
							type="button"
							variant="ghost"
							className="w-full justify-start"
							onClick={() => {
								onSelect(link);
								setOpen(false);
								setQuery("");
							}}
						>
							<i aria-hidden="true" className={`ph ph-${link.icon}`} />
							{link.label}
						</Button>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
}

type CustomFieldItemProps = {
	field: CustomField;
	children: React.ReactNode;
};

function CustomFieldItem({ field, children }: CustomFieldItemProps) {
	const controls = useDragControls();

	return (
		<Reorder.Item
			key={field.id}
			value={field}
			dragListener={false}
			dragControls={controls}
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			className="flex touch-none items-center"
		>
			<Button
				size="icon"
				variant="ghost"
				className="me-2 touch-none"
				aria-label={t`Drag to reorder custom field`}
				onPointerDown={(e) => {
					e.preventDefault();
					controls.start(e);
				}}
			>
				<DotsSixVerticalIcon />
			</Button>

			{children}
		</Reorder.Item>
	);
}
