import type { ExperienceLevel, Locale, Phrase } from "@headcv/content";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { MagnifyingGlassIcon, PencilSimpleLineIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { getPhrases, listUnresolvedPlaceholders, resolvePlaceholders } from "@headcv/content";
import { Button } from "@headcv/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@headcv/ui/components/dialog";
import { Input } from "@headcv/ui/components/input";
import { Label } from "@headcv/ui/components/label";

export type PhrasePickerProps = {
	jobTitleId?: string;
	experienceLevel?: ExperienceLevel;
	locale?: Locale;
	trigger?: React.ReactElement;
	onInsert: (html: string) => void;
};

export function PhrasePicker({
	jobTitleId,
	experienceLevel = "entry",
	locale = "en",
	trigger,
	onInsert,
}: PhrasePickerProps) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [selectedPhrase, setSelectedPhrase] = useState<Phrase | null>(null);
	const [values, setValues] = useState<Record<string, string>>({});

	const phrases = useMemo(
		() =>
			getPhrases({
				sectionType: "experience",
				jobTitleId: jobTitleId || "general",
				experienceLevel,
				locale,
			}),
		[jobTitleId, experienceLevel, locale],
	);

	const filteredPhrases = useMemo(() => {
		const trimmed = query.trim().toLowerCase();
		if (!trimmed) return phrases;
		return phrases.filter((phrase) => phrase.pattern.toLowerCase().includes(trimmed));
	}, [phrases, query]);

	const handleSelect = (phrase: Phrase) => {
		setSelectedPhrase(phrase);
		setValues({});
	};

	const handleInsert = () => {
		if (!selectedPhrase) return;
		const { text, unresolved } = resolvePlaceholders(selectedPhrase.pattern, values);
		if (unresolved.length > 0) return;
		onInsert(text);
		setOpen(false);
		setSelectedPhrase(null);
		setValues({});
		setQuery("");
	};

	const unresolved = selectedPhrase
		? listUnresolvedPlaceholders(resolvePlaceholders(selectedPhrase.pattern, values).text)
		: [];

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					trigger || (
						<Button type="button" variant="outline" size="sm">
							<PencilSimpleLineIcon className="size-4" />
							{t`Insert phrase`}
						</Button>
					)
				}
			/>

			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>{t`Insert phrase pattern`}</DialogTitle>
					<DialogDescription>
						<Trans>Choose a curated phrase pattern and fill in the placeholders with your own facts.</Trans>
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="relative">
						<MagnifyingGlassIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder={t`Search phrases`}
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							className="ps-9"
						/>
					</div>

					{selectedPhrase ? (
						<div className="space-y-4">
							<button
								type="button"
								className="text-start text-muted-foreground text-sm hover:text-foreground"
								onClick={() => setSelectedPhrase(null)}
							>
								{t`← Back to phrases`}
							</button>

							<div className="rounded-md border bg-muted p-3 font-medium text-sm">{selectedPhrase.pattern}</div>

							<div className="grid gap-3 sm:grid-cols-2">
								{selectedPhrase.placeholders.map((placeholder) => (
									<div key={placeholder} className="space-y-1.5">
										<Label htmlFor={`placeholder-${placeholder}`}>{placeholder}</Label>
										<Input
											id={`placeholder-${placeholder}`}
											value={values[placeholder] ?? ""}
											onChange={(event) => setValues((prev) => ({ ...prev, [placeholder]: event.target.value }))}
										/>
									</div>
								))}
							</div>

							{unresolved.length > 0 && (
								<p className="text-destructive text-sm">
									<Trans>Please fill in all placeholders before inserting the phrase.</Trans>
								</p>
							)}

							<div className="flex justify-end">
								<Button type="button" disabled={unresolved.length > 0} onClick={handleInsert}>
									{t`Insert into description`}
								</Button>
							</div>
						</div>
					) : (
						<div className="grid max-h-72 gap-2 overflow-y-auto">
							{filteredPhrases.length === 0 && (
								<p className="text-muted-foreground text-sm">{t`No phrases match your search.`}</p>
							)}

							{filteredPhrases.map((phrase) => (
								<button
									key={phrase.id}
									type="button"
									onClick={() => handleSelect(phrase)}
									className="rounded-md border p-3 text-start text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								>
									{phrase.pattern}
								</button>
							))}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
