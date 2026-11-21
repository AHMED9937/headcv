import * as React from "react";
import { TrialEndedEmail } from "./billing";

void React;

interface TrialEndedTemplateProps {
	name: string;
	plansUrl: string;
}

const TrialEndedTemplate = ({ name, plansUrl }: TrialEndedTemplateProps) => (
	<TrialEndedEmail name={name} plansUrl={plansUrl} />
);

export default Object.assign(TrialEndedTemplate, {
	PreviewProps: {
		name: "Ahmed",
		plansUrl: "https://localhost:3000/dashboard/settings/billing",
	} satisfies TrialEndedTemplateProps,
});
