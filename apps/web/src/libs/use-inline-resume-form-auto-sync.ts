import type { CustomSection } from "@headcv/schema/resume/data";
import type { AnyFormApi } from "@tanstack/react-form";
import { isEqual } from "es-toolkit";
import { useEffect, useRef } from "react";
import { requestResumePreviewSection } from "@/features/resume/preview/preview-navigation";
import { useSetInlineEditPreviewOverride } from "./inline-edit-preview-override";
import { useInlineResumeFormContext } from "./inline-resume-form-context";
import { updateSectionItem } from "./resume/section-actions";

export function useInlineResumeFormAutoSync(form: Pick<AnyFormApi, "store">) {
	const context = useInlineResumeFormContext();
	const setOverride = useSetInlineEditPreviewOverride();

	const initialValuesRef = useRef<unknown>(undefined);
	const lastSyncedValuesRef = useRef<unknown>(undefined);

	const sectionType = context?.sectionType;
	const isCustomSection = sectionType === "custom";
	const isCreate = context?.isCreate ?? false;
	const customSectionId = context?.customSectionId;
	const updateResumeDataLocal = context?.updateResumeDataLocal;

	// Mirror form values into a lightweight preview override while the inline editor
	// is open. New entries live only in this override until Done, so autosave never
	// sends a half-filled item to the server. This avoids writing every keystroke into the global resume store,
	// which would otherwise re-render the entire builder and rebuild the full PDF.
	useEffect(() => {
		if (!context || !sectionType) return;

		const id = form.store.state.values.id as string;
		lastSyncedValuesRef.current = form.store.state.values;
		if (isCustomSection && isCreate) requestResumePreviewSection(id);

		const sync = (values: Record<string, unknown>) => {
			setOverride(
				isCustomSection
					? { kind: "custom-section", sectionId: id, values: values as CustomSection }
					: {
							kind: "item",
							sectionType,
							customSectionId,
							itemId: id,
							values,
						},
			);
		};

		sync(form.store.state.values);

		const subscription = form.store.subscribe(() => {
			const values = form.store.state.values;
			if (isEqual(lastSyncedValuesRef.current, values)) return;
			lastSyncedValuesRef.current = values;

			if (form.store.state.isSubmitSuccessful) return;
			sync(values);
		});

		return () => {
			subscription.unsubscribe();
			setOverride(null);
		};
	}, [context, isCustomSection, isCreate, sectionType, customSectionId, setOverride, form.store]);

	// For inline update forms, restore the original item if the user abandons it.
	useEffect(() => {
		if (!context || isCustomSection || isCreate || !sectionType || !updateResumeDataLocal) return;

		initialValuesRef.current = form.store.state.values;

		return () => {
			if (form.store.state.isSubmitSuccessful) return;
			updateResumeDataLocal((draft) => {
				updateSectionItem(
					draft,
					sectionType,
					initialValuesRef.current as { id: string } & Record<string, unknown>,
					customSectionId,
				);
			});
		};
	}, [context, isCustomSection, isCreate, sectionType, customSectionId, updateResumeDataLocal, form.store]);
}
