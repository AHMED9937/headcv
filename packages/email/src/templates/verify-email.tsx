import * as React from "react";
import { VerifyEmail } from "./auth";

void React;

interface VerifyEmailTemplateProps {
	url: string;
}

const VerifyEmailTemplate = ({ url }: VerifyEmailTemplateProps) => {
	return <VerifyEmail url={url} />;
};

export default Object.assign(VerifyEmailTemplate, {
	PreviewProps: {
		url: "https://localhost:3000/auth/verify-email?token=example-token",
	} satisfies VerifyEmailTemplateProps,
});
