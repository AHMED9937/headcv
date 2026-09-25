import type { SectionType } from "@headcv/schema/resume/data";
import { Plural, Trans } from "@lingui/react/macro";
import { BroomIcon, ColumnsIcon, EyeClosedIcon, EyeIcon, ListIcon } from "@phosphor-icons/react";
import { Button } from "@headcv/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@headcv/ui/components/dropdown-menu";
import { useSectionActions } from "./use-section-actions";

type Props = {
	type: "summary" | SectionType;
};

export function SectionDropdownMenu({ type }: Props) {
	const { canHide, canReset, canSetColumns, columns, isHidden, onReset, onSetColumns, onToggleVisibility } =
		useSectionActions(type);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button size="icon" variant="ghost" onClick={(event) => event.stopPropagation()}>
						<ListIcon />
					</Button>
				}
			/>

			<DropdownMenuContent align="end">
				<DropdownMenuGroup>
					{canHide && (
						<DropdownMenuItem onClick={onToggleVisibility}>
							{isHidden ? <EyeIcon /> : <EyeClosedIcon />}
							{isHidden ? <Trans>Show</Trans> : <Trans>Hide</Trans>}
						</DropdownMenuItem>
					)}

					{canSetColumns && (
						<DropdownMenuSub>
							<DropdownMenuSubTrigger>
								<ColumnsIcon />
								<Trans>Columns</Trans>
							</DropdownMenuSubTrigger>

							<DropdownMenuSubContent>
								<DropdownMenuRadioGroup value={columns?.toString()} onValueChange={onSetColumns}>
									{[1, 2, 3, 4, 5, 6].map((column) => (
										<DropdownMenuRadioItem key={column} value={column.toString()}>
											<Plural value={column} one="# Column" other="# Columns" />
										</DropdownMenuRadioItem>
									))}
								</DropdownMenuRadioGroup>
							</DropdownMenuSubContent>
						</DropdownMenuSub>
					)}
				</DropdownMenuGroup>

				{canReset && (
					<>
						<DropdownMenuSeparator />

						<DropdownMenuGroup>
							<DropdownMenuItem variant="destructive" onClick={onReset}>
								<BroomIcon />
								<Trans>Reset</Trans>
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
