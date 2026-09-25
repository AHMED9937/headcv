import { t } from "@lingui/core/macro";
import { useStore } from "@tanstack/react-form";
import { useCallback, useEffect, useRef } from "react";
import { useDialogStore } from "@/dialogs/store";
import { useChoice, useConfirm } from "@/hooks/use-confirm";

interface UseFormBlockerOptions {
	shouldBlock?: () => boolean;
}

type BlockableFormStore = {
	get: () => {
		isDirty: boolean;
		isSubmitting: boolean;
	};
	subscribe: {
		(observer: {
			next?: (value: { isDirty: boolean; isSubmitting: boolean }) => void;
			error?: (error: unknown) => void;
			complete?: () => void;
		}): { unsubscribe: () => void };
		(
			next: (value: { isDirty: boolean; isSubmitting: boolean }) => void,
			error?: (error: unknown) => void,
			complete?: () => void,
		): { unsubscribe: () => void };
	};
};

export function useFormBlocker<TStore extends BlockableFormStore>(
	form: { store: TStore; handleSubmit?: () => unknown },
	options?: UseFormBlockerOptions,
) {
	const confirm = useConfirm();
	const choose = useChoice();
	// Resume entry forms offer "Save" in the prompt; other dialogs keep the plain leave/stay confirm.
	const canSave = useDialogStore((state) => state.activeDialog?.type.startsWith("resume.") ?? false);
	const closeDialog = useDialogStore((state) => state.closeDialog);
	const setOnBeforeClose = useDialogStore((state) => state.setOnBeforeClose);

	const isDirty = useStore(form.store, (state) => state.isDirty);
	const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
	const shouldBlockRef = useRef(options?.shouldBlock);

	useEffect(() => {
		shouldBlockRef.current = options?.shouldBlock;
	}, [options?.shouldBlock]);

	const shouldBlock = useCallback(() => {
		if (shouldBlockRef.current) return shouldBlockRef.current();
		return isDirty && !isSubmitting;
	}, [isDirty, isSubmitting]);

	const confirmClose = useCallback(async () => {
		if (!shouldBlock()) return true;

		if (canSave && form.handleSubmit) {
			const choice = await choose(t`Save your changes?`, {
				description: t`You have unsaved changes in this entry.`,
				confirmText: t`Save`,
				alternativeText: t`Discard`,
				cancelText: t`Keep editing`,
			});
			if (choice === "cancel") return false;
			if (choice === "alternative") return true;

			// Invalid entries stay open with their field errors visible.
			await form.handleSubmit();
			return (form.store.get() as { isSubmitSuccessful?: boolean }).isSubmitSuccessful === true;
		}

		return confirm(t`Are you sure you want to close this dialog?`, {
			description: t`You have unsaved changes that will be lost.`,
			confirmText: t`Leave`,
			cancelText: t`Stay`,
		});
	}, [shouldBlock, confirm, choose, canSave, form]);

	const requestClose = useCallback(async () => {
		const confirmed = await confirmClose();
		if (!confirmed) return;

		closeDialog();
	}, [confirmClose, closeDialog]);

	useEffect(() => {
		setOnBeforeClose(confirmClose);
		return () => setOnBeforeClose(null);
	}, [confirmClose, setOnBeforeClose]);

	return { requestClose };
}
