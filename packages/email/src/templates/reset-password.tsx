import * as React from "react";
import { ResetPasswordEmail } from "./auth";

void React;

interface ResetPasswordTemplateProps {
	url: string;
}

const ResetPasswordTemplate = ({ url }: ResetPasswordTemplateProps) => {
	return <ResetPasswordEmail url={url} />;
};

export default Object.assign(ResetPasswordTemplate, {
	PreviewProps: {
		url: "https://localhost:3000/auth/reset-password?token=example-token",
	} satisfies ResetPasswordTemplateProps,
});
