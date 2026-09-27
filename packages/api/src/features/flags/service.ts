import { env } from "@headcv/env/server";

export type FeatureFlags = {
	disableSignups: boolean;
	disableEmailAuth: boolean;
	/** Mailbox domains accepted for email/password sign-up; ["*"] accepts any. */
	signupEmailDomains: string[];
};

export const flagsService = {
	getFlags: (): FeatureFlags => ({
		disableSignups: env.FLAG_DISABLE_SIGNUPS,
		disableEmailAuth: env.FLAG_DISABLE_EMAIL_AUTH,
		signupEmailDomains: env.SIGNUP_ALLOWED_EMAIL_DOMAINS,
	}),
};
