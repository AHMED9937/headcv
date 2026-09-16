import { Trans } from "@lingui/react/macro";

export function HiredBar() {
	return (
		<section
			aria-label="Social proof"
			className="bg-primary px-4 py-16 text-center text-primary-foreground sm:px-6 sm:py-20 lg:px-8"
		>
			<div className="container mx-auto max-w-3xl">
				<h2 className="font-bold font-display text-2xl tracking-tight sm:text-3xl lg:text-4xl">
					<Trans>Our candidates have been hired at</Trans>
				</h2>
				<p className="mt-4 text-primary-foreground/85">
					<Trans>Leading companies in tech, finance, healthcare, and government trust HeadCV users.</Trans>
				</p>
			</div>
		</section>
	);
}
