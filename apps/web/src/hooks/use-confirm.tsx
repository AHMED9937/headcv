import * as React from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@headcv/ui/components/alert-dialog";
import { cn } from "@headcv/utils/style";

interface ConfirmOptions {
	description?: string;
	confirmText?: string;
	cancelText?: string;
}

interface ChoiceOptions extends ConfirmOptions {
	/** Label of the secondary, non-cancelling action (e.g. "Discard"). */
	alternativeText: string;
}

/** `cancel` covers the cancel button, Escape and clicking outside. */
export type ConfirmChoice = "confirm" | "alternative" | "cancel";

interface ConfirmState extends ConfirmOptions {
	open: boolean;
	title: string;
	alternativeText?: string;
	resolve: ((value: ConfirmChoice) => void) | null;
}

type ConfirmContextType = {
	confirm: (title: string, options?: ConfirmOptions) => Promise<boolean>;
	choose: (title: string, options: ChoiceOptions) => Promise<ConfirmChoice>;
};

const ConfirmContext = React.createContext<ConfirmContextType | null>(null);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
	const [state, setState] = React.useState<ConfirmState>({
		open: false,
		resolve: null,
		title: "",
		description: undefined,
		confirmText: undefined,
		cancelText: undefined,
	});

	const choose = React.useCallback(async (title: string, options?: Partial<ChoiceOptions>): Promise<ConfirmChoice> => {
		return new Promise<ConfirmChoice>((resolve) => {
			setState({
				open: true,
				resolve,
				title,
				description: options?.description,
				confirmText: options?.confirmText,
				cancelText: options?.cancelText,
				alternativeText: options?.alternativeText,
			});
		});
	}, []);

	const confirm = React.useCallback(
		async (title: string, options?: ConfirmOptions) => (await choose(title, options)) === "confirm",
		[choose],
	);

	const settle = React.useCallback(
		(choice: ConfirmChoice) => {
			if (state.resolve) state.resolve(choice);

			setState((prev) => ({ ...prev, open: false, resolve: null }));
		},
		[state.resolve],
	);

	const handleCancel = React.useCallback(() => settle("cancel"), [settle]);

	return (
		<ConfirmContext.Provider value={{ confirm, choose }}>
			{children}

			<AlertDialog open={state.open} onOpenChange={(open) => !open && handleCancel()}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{state.title}</AlertDialogTitle>
						<AlertDialogDescription className={cn(!state.description && "sr-only")}>
							{state.description}
						</AlertDialogDescription>
					</AlertDialogHeader>

					<AlertDialogFooter>
						<AlertDialogCancel onClick={handleCancel}>{state.cancelText ?? "Cancel"}</AlertDialogCancel>
						{state.alternativeText && (
							<AlertDialogCancel variant="destructive" onClick={() => settle("alternative")}>
								{state.alternativeText}
							</AlertDialogCancel>
						)}
						<AlertDialogAction onClick={() => settle("confirm")}>{state.confirmText ?? "Confirm"}</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</ConfirmContext.Provider>
	);
}

export function useConfirm() {
	const context = React.use(ConfirmContext);

	if (!context) {
		throw new Error("useConfirm must be used within a <ConfirmDialogProvider />.");
	}

	return context.confirm;
}

export function useChoice() {
	const context = React.use(ConfirmContext);

	if (!context) {
		throw new Error("useChoice must be used within a <ConfirmDialogProvider />.");
	}

	return context.choose;
}
