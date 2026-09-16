import type { UIMessage } from "ai";
import { t } from "@lingui/core/macro";
import { CheckIcon, CircleNotchIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { Badge } from "@headcv/ui/components/badge";
import { cn } from "@headcv/utils/style";

export function ToolActivity({ part }: { part: UIMessage["parts"][number] }) {
	if (!part.type.startsWith("tool-") && part.type !== "dynamic-tool") return null;
	const tool = part as { type: string; toolName?: string; state?: string; errorText?: string };
	const name = tool.type === "dynamic-tool" ? tool.toolName : tool.type.slice(5);
	const done = tool.state === "output-available";
	const failed = tool.state === "output-error" || tool.state === "output-denied";

	const label =
		name === "read_resume"
			? done
				? t`Resume read`
				: t`Reading your resume…`
			: name === "read_attachment"
				? done
					? t`Attachment read`
					: t`Reading attachment…`
				: name === "web_search"
					? done
						? t`Web search complete`
						: t`Searching the web…`
					: done
						? t`Step complete`
						: t`Working on your request…`;

	return (
		<div role="status">
			<Badge
				className={cn(
					"gap-1 border-transparent",
					failed && "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200",
					done && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
					!failed && !done && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
				)}
			>
				{failed ? (
					<WarningCircleIcon className="size-3.5" weight="fill" aria-hidden />
				) : done ? (
					<CheckIcon className="size-3.5" weight="bold" aria-hidden />
				) : (
					<CircleNotchIcon className="size-3.5 motion-safe:animate-spin" aria-hidden />
				)}
				<span>{failed ? t`This step failed. Please try again.` : label}</span>
			</Badge>
		</div>
	);
}
