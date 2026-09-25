import type { ComponentProps } from "react";
import { t } from "@lingui/core/macro";
import { CalendarBlankIcon } from "@phosphor-icons/react";
import { useRef } from "react";
import { Button } from "@headcv/ui/components/button";
import { Input } from "@headcv/ui/components/input";
import { cn } from "@headcv/utils/style";

type Props = Omit<ComponentProps<typeof Input>, "type" | "value"> & {
	value?: string;
};

export function MonthInput({ className, value, ...props }: Props) {
	const inputRef = useRef<HTMLInputElement>(null);

	const openPicker = () => {
		const input = inputRef.current;
		if (!input) return;
		try {
			input.showPicker();
		} catch {
			input.focus();
		}
	};

	return (
		<div className="relative">
			<Input
				ref={inputRef}
				type="month"
				value={value ?? ""}
				className={cn("appearance-none pe-10 [&::-webkit-calendar-picker-indicator]:hidden", className)}
				{...props}
			/>
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				className="absolute inset-e-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
				onClick={openPicker}
				aria-label={t`Choose month`}
			>
				<CalendarBlankIcon aria-hidden="true" />
			</Button>
		</div>
	);
}
