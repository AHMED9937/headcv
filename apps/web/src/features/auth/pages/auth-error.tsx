import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { Link, useSearch } from "@tanstack/react-router";
import { Button } from "@headcv/ui/components/button";

/** Plain-language copy for Better Auth's OAuth error codes; unknown codes get a generic message. */
export function getAuthErrorMessage(code: string | undefined): string {
	switch (code) {
		case "account_not_linked":
			return t`We couldn't connect this sign-in method to your account. Sign in with your email and password, then try again.`;
		case "signup_disabled":
			return t`New sign-ups are currently closed.`;
		case "state_mismatch":
		case "state_not_found":
		case "please_restart_the_process":
			return t`Your sign-in session expired. Please try again.`;
		default:
			return t`Something went wrong while signing you in. Please try again.`;
	}
}

export function AuthErrorPage() {
	const { error } = useSearch({ from: "/auth/error" });

	return (
		<>
			<div className="space-y-1 text-center">
				<h1 className="font-semibold text-2xl tracking-tight">
					<Trans>We couldn't sign you in</Trans>
				</h1>
				<p className="text-muted-foreground">{getAuthErrorMessage(error)}</p>
			</div>

			<Button
				nativeButton={false}
				render={
					<Link to="/auth/login">
						<Trans comment="Button label on the sign-in error page">Back to sign in</Trans>
					</Link>
				}
			/>
		</>
	);
}
