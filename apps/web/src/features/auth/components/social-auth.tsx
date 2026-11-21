import type { CheckoutPlan } from "@/features/billing/checkout-plan";
import type { RouterOutput } from "@/libs/orpc/client";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { AppleLogoIcon, FingerprintIcon, GithubLogoIcon, LinkedinLogoIcon, VaultIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@headcv/ui/components/button";
import { Skeleton } from "@headcv/ui/components/skeleton";
import { authClient } from "@/libs/auth/client";
import { orpc } from "@/libs/orpc/client";

type PendingPlan = CheckoutPlan;

/** Session-storage key used to persist plan intent across OAuth redirects. */
const PENDING_PLAN_KEY = "headcv_pending_plan";

type SocialAuthProps = {
	pendingPlan?: PendingPlan;
};

type SocialSignInOptions = {
	provider: string;
	callbackURL: string;
	requestSignUp: true;
};

/**
 * "Continue with <provider>" behaves the same on Login and Register: an existing account is
 * signed in, a new one is created. The server still blocks sign-ups when FLAG_DISABLE_SIGNUPS is set.
 */
export function getSocialSignInOptions(provider: string, pendingPlan?: PendingPlan): SocialSignInOptions {
	const callbackURL = pendingPlan ? `/dashboard?checkoutPlan=${pendingPlan}` : "/dashboard";
	return { provider, callbackURL, requestSignUp: true };
}

export function SocialAuth({ pendingPlan }: SocialAuthProps) {
	const { data: providers = {}, isLoading } = useQuery(orpc.auth.providers.list.queryOptions());

	// The password form isn't a button here; with nothing else enabled, drop the divider too.
	const hasButtonProviders = Object.keys(providers).some((provider) => provider !== "credential");
	if (!isLoading && !hasButtonProviders) return null;

	return (
		<>
			<div className="flex items-center gap-x-2">
				<hr className="flex-1" />
				<span className="font-medium text-xs tracking-wide">
					<Trans context="Choose to authenticate with a social provider (Google, GitHub, etc.) instead of email and password">
						or continue with
					</Trans>
				</span>
				<hr className="flex-1" />
			</div>

			{isLoading ? <SocialAuthSkeleton /> : <SocialAuthButtons providers={providers} pendingPlan={pendingPlan} />}
		</>
	);
}

/** Google's official multicolour "G" (brand guidelines require the unaltered mark). */
function GoogleMark() {
	return (
		<svg viewBox="0 0 48 48" aria-hidden="true" className="size-4">
			<path
				fill="#EA4335"
				d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
			/>
			<path
				fill="#4285F4"
				d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
			/>
			<path
				fill="#FBBC05"
				d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
			/>
			<path
				fill="#34A853"
				d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
			/>
		</svg>
	);
}

function SocialAuthSkeleton() {
	return (
		<div className="grid grid-cols-2 gap-4">
			<Skeleton className="h-9 w-full" />
			<Skeleton className="h-9 w-full" />
			<Skeleton className="h-9 w-full" />
			<Skeleton className="h-9 w-full" />
		</div>
	);
}

type SocialAuthButtonsProps = {
	providers: RouterOutput["auth"]["providers"]["list"];
	pendingPlan?: PendingPlan;
};

function SocialAuthButtons({ providers, pendingPlan }: SocialAuthButtonsProps) {
	const router = useRouter();

	const handleSocialLogin = async (provider: string) => {
		const toastId = toast.loading(t`Signing in...`);

		// Persist plan intent in sessionStorage as a backup for OAuth redirect
		if (pendingPlan) {
			sessionStorage.setItem(PENDING_PLAN_KEY, pendingPlan);
		}

		const { error } = await authClient.signIn.social(getSocialSignInOptions(provider, pendingPlan));

		if (error) {
			toast.error(
				error.message ||
					t({
						comment: "Fallback toast when social sign-in fails without a provider error message",
						message: "Failed to sign in. Please try again.",
					}),
				{ id: toastId },
			);
			return;
		}

		toast.dismiss(toastId);
		await router.invalidate();
	};

	const handleOAuthLogin = async () => {
		const toastId = toast.loading(t`Signing in...`);

		// Persist plan intent in sessionStorage as a backup for OAuth redirect
		if (pendingPlan) {
			sessionStorage.setItem(PENDING_PLAN_KEY, pendingPlan);
		}

		const callbackURL = pendingPlan ? `/dashboard?checkoutPlan=${pendingPlan}` : "/dashboard";

		const { error } = await authClient.signIn.oauth2({
			providerId: "custom",
			callbackURL,
		});

		if (error) {
			toast.error(
				error.message ||
					t({
						comment: "Fallback toast when custom OAuth sign-in fails without a provider error message",
						message: "Failed to sign in. Please try again.",
					}),
				{ id: toastId },
			);
			return;
		}

		toast.dismiss(toastId);
		await router.invalidate();
	};

	const handlePasskeyLogin = async () => {
		const toastId = toast.loading(t`Signing in...`);

		const { error } = await authClient.signIn.passkey({ autoFill: false });

		if (error) {
			toast.error(
				error.message ||
					t({
						comment: "Fallback toast when passkey sign-in fails without an error message",
						message: "Failed to sign in. Please try again.",
					}),
				{ id: toastId },
			);
			return;
		}

		toast.dismiss(toastId);
		await router.invalidate();
	};

	return (
		<div className="grid grid-cols-2 gap-4">
			{"google" in providers && (
				// Full width like the primary button; neutral outline + official mark per Google's branding rules.
				<Button variant="outline" onClick={() => handleSocialLogin("google")} className="col-span-full">
					<GoogleMark />
					<Trans comment="Label for the Google sign-in/sign-up button">Continue with Google</Trans>
				</Button>
			)}

			{"apple" in providers && (
				<Button onClick={() => handleSocialLogin("apple")} className="flex-1 bg-black text-white hover:bg-black/80">
					<AppleLogoIcon weight="fill" />
					<Trans comment="Brand name label for Apple social sign-in button">Apple</Trans>
				</Button>
			)}

			{"github" in providers && (
				<Button
					onClick={() => handleSocialLogin("github")}
					className="flex-1 bg-[#2b3137] text-white hover:bg-[#2b3137]/80"
				>
					<GithubLogoIcon />
					<Trans comment="Brand name label for GitHub social sign-in button">GitHub</Trans>
				</Button>
			)}

			{"linkedin" in providers && (
				<Button
					onClick={() => handleSocialLogin("linkedin")}
					className="flex-1 bg-[#0A66C2] text-white hover:bg-[#0A66C2]/80"
				>
					<LinkedinLogoIcon />
					<Trans comment="Brand name label for LinkedIn social sign-in button">LinkedIn</Trans>
				</Button>
			)}

			{"custom" in providers && (
				<Button variant="secondary" onClick={handleOAuthLogin}>
					<VaultIcon />
					{providers.custom}
				</Button>
			)}

			{"passkey" in providers && (
				<Button variant="secondary" onClick={handlePasskeyLogin}>
					<FingerprintIcon />
					<Trans comment="Label for passkey sign-in button">Passkey</Trans>
				</Button>
			)}
		</div>
	);
}
