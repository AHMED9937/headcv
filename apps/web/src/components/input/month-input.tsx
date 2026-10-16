import type { ComponentProps } from "react";
import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { CalendarBlankIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Button } from "@headcv/ui/components/button";
import { Input } from "@headcv/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@headcv/ui/components/popover";
import { cn } from "@headcv/utils/style";

type Props = Omit<ComponentProps<typeof Input>, "onChange" | "type" | "value"> & {
	value?: string;
	onValueChange?: (value: string) => void;
};

const parseMonth = (value?: string) => {
	const match = /^(\d{4})-(\d{2})$/.exec(value ?? "");
	if (!match) return null;
	return { year: Number(match[1]), month: Number(match[2]) };
};

const toMonthValue = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}`;

export function MonthInput({
	className,
	disabled,
	max,
	min,
	onBlur,
	onClick,
	onValueChange,
	readOnly,
	value,
	...props
}: Props) {
	const { i18n } = useLingui();
	const selected = parseMonth(value);
	const [open, setOpen] = useState(false);
	const [visibleYear, setVisibleYear] = useState(() => selected?.year ?? new Date().getFullYear());
	const formatter = useMemo(
		() => new Intl.DateTimeFormat(i18n.locale, { month: "long", year: "numeric", timeZone: "UTC" }),
		[i18n.locale],
	);
	const monthFormatter = useMemo(
		() => new Intl.DateTimeFormat(i18n.locale, { month: "short", timeZone: "UTC" }),
		[i18n.locale],
	);
	const monthLabels = useMemo(
		() => Array.from({ length: 12 }, (_, index) => monthFormatter.format(new Date(Date.UTC(2024, index, 1)))),
		[monthFormatter],
	);
	const displayValue = selected ? formatter.format(new Date(Date.UTC(selected.year, selected.month - 1, 1))) : "";
	const isUnavailable = disabled || readOnly;

	const chooseMonth = (month: number) => {
		onValueChange?.(toMonthValue(visibleYear, month));
		setOpen(false);
	};

	return (
		<Popover
			open={open}
			onOpenChange={(nextOpen) => {
				if (isUnavailable) return;
				if (nextOpen) setVisibleYear(selected?.year ?? new Date().getFullYear());
				setOpen(nextOpen);
			}}
		>
			<PopoverTrigger
				render={
					<div className="relative">
						<Input
							{...props}
							value={displayValue}
							readOnly
							disabled={disabled}
							className={cn("cursor-pointer pe-10", className)}
							onBlur={onBlur}
							onClick={onClick}
						/>
						<CalendarBlankIcon
							aria-hidden="true"
							className="pointer-events-none absolute inset-e-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
						/>
					</div>
				}
			/>

			<PopoverContent align="start" className="w-72">
				<div className="flex items-center justify-between">
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={() => setVisibleYear((year) => year - 1)}
						aria-label={t`Previous year`}
					>
						<CaretLeftIcon aria-hidden="true" />
					</Button>
					<strong>{visibleYear}</strong>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={() => setVisibleYear((year) => year + 1)}
						aria-label={t`Next year`}
					>
						<CaretRightIcon aria-hidden="true" />
					</Button>
				</div>

				<div className="grid grid-cols-3 gap-1">
					{monthLabels.map((label, index) => {
						const month = index + 1;
						const monthValue = toMonthValue(visibleYear, month);
						const selectedMonth = value === monthValue;
						const outsideRange =
							(typeof min === "string" && monthValue < min) || (typeof max === "string" && monthValue > max);

						return (
							<Button
								key={monthValue}
								type="button"
								variant={selectedMonth ? "default" : "ghost"}
								disabled={outsideRange}
								onClick={() => chooseMonth(month)}
								aria-pressed={selectedMonth}
							>
								{label}
							</Button>
						);
					})}
				</div>

				{value ? (
					<Button
						type="button"
						variant="ghost"
						className="w-full"
						onClick={() => {
							onValueChange?.("");
							setOpen(false);
						}}
					>
						{t`Clear date`}
					</Button>
				) : null}
			</PopoverContent>
		</Popover>
	);
}
