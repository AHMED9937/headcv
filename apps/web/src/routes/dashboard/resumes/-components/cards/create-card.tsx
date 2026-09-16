import { t } from "@lingui/core/macro";
import { ArrowRightIcon, PlusIcon } from "@phosphor-icons/react";
import { useNavigate } from "@tanstack/react-router";
import { BaseCard } from "./base-card";

export function CreateResumeCard() {
	const navigate = useNavigate();

	function openCreateFlow() {
		void navigate({ to: "/templates" });
	}

	return (
		<BaseCard
			title={t`Create a new resume`}
			description={t`Choose a template and start building`}
			onClick={openCreateFlow}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") openCreateFlow();
			}}
			role="button"
			tabIndex={0}
			aria-label={t`Create a new resume from a template`}
		>
			<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-primary/5 text-primary">
				<div className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
					<PlusIcon weight="regular" className="size-8" />
				</div>
				<span className="flex items-center gap-1 text-sm">
					<span>{t`Start guided build`}</span>
					<ArrowRightIcon className="rtl-flip size-4" />
				</span>
			</div>
		</BaseCard>
	);
}
