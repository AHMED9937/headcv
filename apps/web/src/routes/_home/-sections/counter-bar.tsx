import { Trans } from "@lingui/react/macro";
import { TrustMark } from "./trust-mark";

export function CounterBar() {
	return (
		<div className="border-y bg-primary px-4 py-5 text-primary-foreground">
			<ul className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm">
				<li className="flex items-center gap-2">
					<TrustMark />
					<Trans id="home.trust.free">Free to get started</Trans>
				</li>
				<li className="flex items-center gap-2">
					<TrustMark />
					<Trans id="home.noCard">No credit card</Trans>
				</li>
				<li className="flex items-center gap-2">
					<TrustMark />
					<Trans id="home.pdf">ATS-friendly PDFs</Trans>
				</li>
			</ul>
		</div>
	);
}
