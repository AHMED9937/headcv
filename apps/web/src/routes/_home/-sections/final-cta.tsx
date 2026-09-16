import { Trans } from "@lingui/react/macro";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Button } from "@headcv/ui/components/button";
import { cn } from "@headcv/utils/style";
import { landingArrowHover } from "./landing-motion";

export function FinalCta() {
	return (
		<section aria-labelledby="final-heading" className="px-4 pt-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
			<div className="mx-auto flex max-w-6xl flex-col items-start gap-6 rounded-2xl border border-primary/15 bg-card p-6 shadow-sm sm:p-10 md:flex-row md:items-center md:justify-between">
				<div className="min-w-0 text-start">
					<h2 id="final-heading" className="font-bold font-display text-2xl text-primary sm:text-3xl">
						<Trans id="home.final.title">Ready to get hired?</Trans>
					</h2>
					<p className="mt-2 text-muted-foreground leading-relaxed">
						<Trans id="home.final.text">Join the candidates who turned their experience into offers.</Trans>
					</p>
				</div>
				<Button
					nativeButton={false}
					className="group h-auto min-h-12 w-full shrink-0 gap-3 whitespace-normal px-7 py-3 font-semibold text-base motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 sm:w-auto"
					render={<Link to="/templates" search={{}} />}
				>
					<Trans id="home.create">Create my CV</Trans>
					<ArrowRightIcon aria-hidden="true" className={cn("rtl-flip size-5", landingArrowHover)} />
				</Button>
			</div>
		</section>
	);
}
