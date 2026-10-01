import { t } from "@lingui/core/macro";
import { TipPopover } from "./tip-popover";

function getSectionTips(type: string): string[] {
	switch (type) {
		case "basics":
			return [t`Keep contact details current and professional; include only links you actively maintain.`];
		case "experience":
			return [t`Start with an action, show your contribution, and quantify the result when possible.`];
		case "education":
			return [t`Prioritize the degree, relevant study, and distinctions that support the target role.`];
		case "projects":
			return [t`State what you built, your contribution, and the outcome; add a working link.`];
		case "skills":
			return [t`List relevant, demonstrable skills using terminology from the target role.`];
		case "languages":
			return [t`Use a recognized and honest proficiency level.`];
		case "awards":
			return [t`Name the awarding body and briefly show why the award is notable.`];
		case "certifications":
			return [t`Use the exact credential and issuer, with a verification link when available.`];
		case "publications":
			return [t`Keep citation details consistent and link to the publication.`];
		case "interests":
			return [t`Choose specific interests that add useful context or show commitment.`];
		case "volunteer":
			return [t`Describe your contribution and impact with the same clarity as paid experience.`];
		case "references":
			return [t`Ask permission first and keep the reference's role and contact details current.`];
		case "summary":
			return [t`Tailor a few lines to the target role, strongest skills, and evidence.`];
		case "picture":
			return [t`Use a clear, professional headshot with a neutral background.`];
		case "cover-letter":
			return [t`Tailor the message to the employer and support your fit with one concrete example.`];
		default:
			return [t`Keep this entry relevant, specific, and easy to scan.`];
	}
}

export function SectionTips({ type }: { type: string }) {
	return <TipPopover tips={getSectionTips(type)} />;
}
