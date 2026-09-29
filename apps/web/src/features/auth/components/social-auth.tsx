import type { RouterOutput } from "@/libs/orpc/client";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
	AppleLogoIcon,
	FingerprintIcon,
	GithubLogoIcon,
	GoogleLogoIcon,
	LinkedinLogoIcon,
	VaultIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@headcv/ui/components/button";
import { Skeleton } from "@headcv/ui/components/skeleton";
import { authClient } from "@/libs/auth/client";
import { orpc } from "@/libs/orpc/client";

type PendingPlan = "monthly" | "yearly" | "trial";

/** Session-storage key used to persist plan intent across OAuth redirects. */
const PENDING_PLAN_KEY = "headcv_pending_plan";

type SocialAuthProps = {
	requestSignUp?: boolean;
	pendingPlan?: PendingPlan;
};

type SocialSignInOptions = {
	provider: string;
	callbackURL: string;
	requestSignUp?: true;
};

function getSocialSignInOptions(
	provider: string,
	requestSignUp: boolean,
	pendingPlan?: PendingPlan,
): SocialSignInOptions {
	const callbackURL = pendingPlan ? `/dashboard?checkoutPlan=${pendingPlan}` : "/dashboard";
	const options: SocialSignInOptions = { provider, callbackURL };
	if (requestSignUp) options.requestSignUp = true;
	return options;
}

export function SocialAuth({ requestSignUp = false, pendingPlan }: SocialAuthProps) {
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

			{isLoading ? (
				<SocialAuthSkeleton />
			) : (
				<SocialAuthButtons providers={providers} requestSignUp={requestSignUp} pendingPlan={pendingPlan} />
			)}
		</>
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
	requestSignUp: boolean;
	pendingPlan?: PendingPlan;
};

function SocialAuthButtons({ providers, requestSignUp, pendingPlan }: SocialAuthButtonsProps) {
	const router = useRouter();

	const handleSocialLogin = async (provider: string) => {
		const toastId = toast.loading(t`Signing in...`);

		// Persist plan intent in sessionStorage as a backup for OAuth redirect
		if (pendingPlan) {
			sessionStorage.setItem(PENDING_PLAN_KEY, pendingPlan);
		}

		const { error } = await authClient.signIn.social(getSocialSignInOptions(provider, requestSignUp, pendingPlan));

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
				<Button
					onClick={() => handleSocialLogin("google")}
					className="flex-1 bg-[#4285F4] text-white hover:bg-[#4285F4]/80"
				>
					<GoogleLogoIcon />
					<Trans comment="Brand name label for Google social sign-in button">Google</Trans>
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
