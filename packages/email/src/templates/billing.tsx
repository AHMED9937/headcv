import * as React from "react";
import { AuthEmailLayout } from "./auth";

void React;

interface TrialEndedEmailProps {
	name?: string | null;
	plansUrl: string;
}

/** Sent once when a one-time 7-day trial pass ends. Nothing was charged and nothing renews. */
export function TrialEndedEmail({ name, plansUrl }: TrialEndedEmailProps) {
	return (
		<AuthEmailLayout
			preview="Your HeadCV Pro trial has ended. Nothing renews and you won't be charged."
			eyebrow="HeadCV Pro"
			heading="Your 7-day trial has ended"
			intro={`${name ? `Hi ${name}, your` : "Your"} HeadCV Pro trial is over and your account is back on the Free plan. Nothing renews and you won't be charged.`}
			details="Your resumes are safe. Free includes 3 resumes, unlimited PDF downloads and every template."
			actionLabel="Keep Pro"
			actionUrl={plansUrl}
			outro="Choose Monthly or Yearly any time to get unlimited resumes, imports and AI help back."
		/>
	);
}

/** The email ready for `sendEmail({ react })`, so senders outside React code don't need JSX. */
export const trialEndedEmail = (props: TrialEndedEmailProps) => <TrialEndedEmail {...props} />;
