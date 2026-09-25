// @vitest-environment happy-dom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { useDialogStore } from "@/dialogs/store";
import { useAppForm } from "@/libs/tanstack-form";
import { ConfirmDialogProvider } from "./use-confirm";
import { useFormBlocker } from "./use-form-blocker";

const onSubmit = vi.fn();

function EntryForm() {
	const form = useAppForm({ defaultValues: { name: "" }, onSubmit });
	useFormBlocker(form);

	return <input aria-label="Name" onChange={(event) => form.setFieldValue("name", event.target.value)} />;
}

async function editAndRequestClose() {
	render(
		<ConfirmDialogProvider>
			<EntryForm />
		</ConfirmDialogProvider>,
	);
	await userEvent.setup().type(screen.getByRole("textbox", { name: "Name" }), "Acme");

	const guard = useDialogStore.getState().onBeforeClose;
	if (!guard) throw new Error("guard was not registered");
	return guard();
}

describe("useFormBlocker on resume entries", () => {
	beforeAll(() => {
		i18n.loadAndActivate({ locale: "en", messages: {} });
	});

	beforeEach(() => {
		onSubmit.mockReset();
		useDialogStore.setState({
			open: false,
			presentation: "inline",
			activeDialog: { type: "resume.sections.experience.create", data: undefined },
			onBeforeClose: null,
		});
	});

	it("saves the entry when the user chooses Save", async () => {
		const result = editAndRequestClose();
		await userEvent.setup().click(await screen.findByRole("button", { name: "Save" }));

		await expect(result).resolves.toBe(true);
		expect(onSubmit).toHaveBeenCalledOnce();
	});

	it("leaves without saving when the user chooses Discard", async () => {
		const result = editAndRequestClose();
		await userEvent.setup().click(await screen.findByRole("button", { name: "Discard" }));

		await expect(result).resolves.toBe(true);
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("keeps editing when the user chooses Keep editing", async () => {
		const result = editAndRequestClose();
		await userEvent.setup().click(await screen.findByRole("button", { name: "Keep editing" }));

		await expect(result).resolves.toBe(false);
		expect(onSubmit).not.toHaveBeenCalled();
		await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
	});
});
