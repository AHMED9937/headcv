import type { ExperienceLevel, Locale, SummaryFormula } from "@headcv/content";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useMemo, useState } from "react";
import { getJobTitleById, getSummaryFormulas, listUnresolvedPlaceholders, resolvePlaceholders } from "@headcv/content";
import { Button } from "@headcv/ui/components/button";
import { Input } from "@headcv/ui/components/input";
import { Label } from "@headcv/ui/components/label";
import { RichInput } from "@/components/input/rich-input";

export type SummaryBuilderProps = {
	value: string;
	onChange: (value: string) => void;
	targetJobTitleId?: string;
	experienceLevel?: ExperienceLevel;
	topSkills?: string[];
	locale?: Locale;
};

export function SummaryBuilder({
	value,
	onChange,
	targetJobTitleId,
	experienceLevel = "entry",
	topSkills = [],
	locale = "en",
}: SummaryBuilderProps) {
	const formulas = useMemo(() => getSummaryFormulas(locale), [locale]);
	const [selectedFormula, setSelectedFormula] = useState<SummaryFormula | null>(null);
	const [factValues, setFactValues] = useState<Record<string, string>>({});
	const [customSummary, setCustomSummary] = useState(value);

	const jobTitle = useMemo(
		() => (targetJobTitleId ? getJobTitleById(targetJobTitleId, locale)?.title : ""),
		[targetJobTitleId, locale],
	);

	const handleSelectFormula = (formula: SummaryFormula) => {
		setSelectedFormula(formula);
		const defaults: Record<string, string> = {};
		for (const fact of formula.facts) {
			if (fact === "role") defaults[fact] = jobTitle ?? "";
			if (fact === "yearsOfExperience")
				defaults[fact] = experienceLevel === "entry" ? "1" : experienceLevel === "mid" ? "5" : "10";
			if (fact === "topSkill") defaults[fact] = topSkills[0] ?? "";
			if (fact === "secondarySkill") defaults[fact] = topSkills[1] ?? "";
			if (fact === "industry") defaults[fact] = "";
		}
		setFactValues(defaults);
	};

	const assembled = useMemo(() => {
		if (!selectedFormula) return "";
		return resolvePlaceholders(selectedFormula.pattern, factValues).text;
	}, [selectedFormula, factValues]);

	const unresolved = useMemo(() => {
		if (!selectedFormula) return [];
		return listUnresolvedPlaceholders(assembled);
	}, [assembled, selectedFormula]);

	const handleApply = () => {
		if (!selectedFormula || unresolved.length > 0) return;
		onChange(`<p>${assembled}</p>`);
		setCustomSummary(`<p>${assembled}</p>`);
	};

	const handleCustomChange = (next: string) => {
		setCustomSummary(next);
		onChange(next);
	};

	return (
		<div className="space-y-5">
			<div className="space-y-2">
				<h3 className="font-semibold text-sm">
					<Trans>Choose a formula</Trans>
				</h3>
				<div className="grid gap-2">
					{formulas.map((formula) => (
						<button
							key={formula.id}
							type="button"
							onClick={() => handleSelectFormula(formula)}
							className={`rounded-md border p-3 text-start text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
								selectedFormula?.id === formula.id ? "border-primary bg-primary/5" : ""
							}`}
						>
							{formula.pattern}
						</button>
					))}
				</div>
			</div>

			{selectedFormula && (
				<div className="space-y-3 rounded-md border bg-muted p-4">
					<h4 className="font-semibold text-sm">
						<Trans>Fill in your facts</Trans>
					</h4>
					<div className="grid gap-3 sm:grid-cols-2">
						{selectedFormula.facts.map((fact) => (
							<div key={fact} className="space-y-1.5">
								<Label htmlFor={`fact-${fact}`}>{fact}</Label>
								<Input
									id={`fact-${fact}`}
									value={factValues[fact] ?? ""}
									onChange={(event) => setFactValues((prev) => ({ ...prev, [fact]: event.target.value }))}
								/>
							</div>
						))}
					</div>

					<div className="space-y-1">
						<h4 className="font-semibold text-sm">
							<Trans>Preview</Trans>
						</h4>
						<p className="rounded-md border bg-background p-3 text-sm">{assembled}</p>
					</div>

					{unresolved.length > 0 && (
						<p className="text-destructive text-sm">
							<Trans>Fill in every fact before applying the formula.</Trans>
						</p>
					)}

					<Button type="button" disabled={unresolved.length > 0} onClick={handleApply}>
						{t`Apply to summary`}
					</Button>
				</div>
			)}

			<div className="space-y-2">
				<h3 className="font-semibold text-sm">
					<Trans>Edit summary directly</Trans>
				</h3>
				<RichInput value={customSummary} onChange={handleCustomChange} />
			</div>
		</div>
	);
}
