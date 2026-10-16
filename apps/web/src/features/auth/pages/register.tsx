import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { ArrowRightIcon, EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useToggle } from "usehooks-ts";
import z from "zod";
import { Alert, AlertDescription, AlertTitle } from "@headcv/ui/components/alert";
import { Button } from "@headcv/ui/components/button";
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "@headcv/ui/components/form";
import { Input } from "@headcv/ui/components/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@headcv/ui/components/input-group";
import { ANY_EMAIL_DOMAIN, isEmailDomainAllowed } from "@headcv/utils/email-domain";
import { authClient } from "@/libs/auth/client";
import { useAppForm } from "@/libs/tanstack-form";
import { SocialAuth } from "../components/social-auth";

type PendingPlan = "monthly" | "yearly" | "trial";

/** Session-storage key used to persist plan intent across email verification redirects. */
const PENDING_PLAN_KEY = "headcv_pending_plan";

const createFormSchema = (allowedEmailDomains: readonly string[]) =>
	z.object({
		name: z.string().min(3).max(64),
		username: z
			.string()
			.min(3)
			.max(64)
			.trim()
			.toLowerCase()
			.regex(/^[a-z0-9._-]+$/, {
				message: "Username can only contain lowercase letters, numbers, dots, hyphens and underscores.",
			}),
		// Mirrors the server allowlist for instant feedback; the server remains the enforcer.
		email: z
			.string()
			.trim()
			.toLowerCase()
			.email({ message: "Enter a valid email address." })
			.refine((email) => isEmailDomainAllowed(email, allowedEmailDomains), {
				message: `Please use an email from a trusted provider (${allowedEmailDomains.join(", ")}).`,
			}),
		password: z.string().min(6).max(64),
	});

type Props = {
	disableEmailAuth: boolean;
	signupEmailDomains: string[];
	pendingPlan?: PendingPlan;
};

export function RegisterPage({ disableEmailAuth, signupEmailDomains, pendingPlan }: Props) {
	const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
	const [showPassword, toggleShowPassword] = useToggle(false);

	const formSchema = useMemo(() => createFormSchema(signupEmailDomains), [signupEmailDomains]);
	const restrictsEmailDomains = !signupEmailDomains.includes(ANY_EMAIL_DOMAIN);

	const form = useAppForm({
		defaultValues: { name: "", username: "", email: "", password: "" },
		validators: { onSubmit: formSchema },
		onSubmit: async ({ value }) => {
			const toastId = toast.loading(t`Signing up...`);

			// Persist plan intent so it survives email-verification redirect
			if (pendingPlan) {
				sessionStorage.setItem(PENDING_PLAN_KEY, pendingPlan);
			}

			const callbackURL = pendingPlan ? `/dashboard?checkoutPlan=${pendingPlan}` : "/dashboard";

			const { error } = await authClient.signUp.email({
				name: value.name,
				email: value.email,
				password: value.password,
				username: value.username,
				displayUsername: value.username,
				callbackURL,
			});

			if (error) {
				toast.error(
					error.message ||
						t({
							comment: "Fallback toast when account registration fails without a server error message",
							message: "Failed to create your account. Please try again.",
						}),
					{ id: toastId },
				);
				return;
			}

			setSubmittedEmail(value.email);
			toast.dismiss(toastId);
		},
	});

	if (submittedEmail) {
		return (
			<PostSignupScreen
				email={submittedEmail}
				pendingPlan={pendingPlan}
				onUseDifferentEmail={() => setSubmittedEmail(null)}
			/>
		);
	}

	return (
		<>
			<div className="space-y-1 text-center">
				<h1 className="font-semibold text-2xl tracking-tight">
					<Trans>Create a new account</Trans>
				</h1>
			</div>

			{!disableEmailAuth && (
				<form
					noValidate
					className="space-y-6"
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						void form.handleSubmit();
					}}
				>
					<form.Field name="name">
						{(field) => (
							<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
								<FormLabel>
									<Trans comment="Label for full name input on registration form">Name</Trans>
								</FormLabel>
								<FormControl
									render={
										<Input
											min={3}
											max={64}
											autoComplete="section-register name"
											placeholder={t({
												comment: "Example full name placeholder on registration form",
												message: "John Doe",
											})}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) => field.handleChange(event.target.value)}
										/>
									}
								/>
								<FormMessage errors={field.state.meta.errors} />
							</FormItem>
						)}
					</form.Field>

					<form.Field name="username">
						{(field) => (
							<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
								<FormLabel>
									<Trans comment="Label for username input on registration form">Username</Trans>
								</FormLabel>
								<FormControl
									render={
										<Input
											min={3}
											max={64}
											autoComplete="section-register username"
											placeholder={t({
												comment: "Example username placeholder on registration form",
												message: "john.doe",
											})}
											className="lowercase"
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) => field.handleChange(event.target.value)}
										/>
									}
								/>
								<FormMessage errors={field.state.meta.errors} />
							</FormItem>
						)}
					</form.Field>

					<form.Field name="email">
						{(field) => (
							<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
								<FormLabel>
									<Trans comment="Label for email input on registration form">Email Address</Trans>
								</FormLabel>
								<FormControl
									render={
										<Input
											type="email"
											autoComplete="section-register email"
											placeholder={t({
												comment: "Example email placeholder on registration form",
												message: "john.doe@gmail.com",
											})}
											className="lowercase"
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) => field.handleChange(event.target.value)}
										/>
									}
								/>
								<FormMessage errors={field.state.meta.errors} />
								{restrictsEmailDomains && (
									<FormDescription>
										<Trans comment="Hint under the registration email field listing accepted email domains">
											Use an address from: {signupEmailDomains.join(", ")}
										</Trans>
									</FormDescription>
								)}
							</FormItem>
						)}
					</form.Field>

					<form.Field name="password">
						{(field) => (
							<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
								<FormLabel>
									<Trans comment="Label for password input on registration form">Password</Trans>
								</FormLabel>
								<InputGroup>
									<FormControl
										render={
											<InputGroupInput
												min={6}
												max={64}
												type={showPassword ? "text" : "password"}
												autoComplete="section-register new-password"
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) => field.handleChange(event.target.value)}
											/>
										}
									/>

									<InputGroupAddon align="inline-end">
										<InputGroupButton
											size="icon-xs"
											onClick={toggleShowPassword}
											aria-label={
												showPassword
													? t({
															comment: "Accessible label for button that hides password in registration form",
															message: "Hide password",
														})
													: t({
															comment: "Accessible label for button that reveals password in registration form",
															message: "Show password",
														})
											}
										>
											{showPassword ? <EyeIcon /> : <EyeSlashIcon />}
										</InputGroupButton>
									</InputGroupAddon>
								</InputGroup>
								<FormMessage errors={field.state.meta.errors} />
							</FormItem>
						)}
					</form.Field>

					<div className="space-y-3">
						<Button type="submit" className="w-full">
							<Trans comment="Primary action button label on registration form">Sign up</Trans>
						</Button>

						<SignInPrompt pendingPlan={pendingPlan} />
					</div>
				</form>
			)}

			<SocialAuth pendingPlan={pendingPlan} />

			{disableEmailAuth && <SignInPrompt pendingPlan={pendingPlan} />}
		</>
	);
}

function SignInPrompt({ pendingPlan }: { pendingPlan?: PendingPlan }) {
	return (
		<p className="text-center text-muted-foreground text-sm">
			<Trans>
				Already have an account?{" "}
				<Button
					variant="link"
					nativeButton={false}
					className="h-auto gap-1.5 px-1! py-0"
					render={
						<Link to="/auth/login" search={pendingPlan ? { plan: pendingPlan } : {}}>
							<Trans comment="Call-to-action link from registration page to login page">Sign in now</Trans>{" "}
							<ArrowRightIcon />
						</Link>
					}
				/>
			</Trans>
		</p>
	);
}

function PostSignupScreen({
	email,
	pendingPlan,
	onUseDifferentEmail,
}: {
	email: string;
	pendingPlan?: PendingPlan;
	onUseDifferentEmail: () => void;
}) {
	const [isResending, setIsResending] = useState(false);
	const callbackURL = pendingPlan ? `/dashboard?checkoutPlan=${pendingPlan}` : "/dashboard";

	const resendVerificationEmail = async () => {
		setIsResending(true);
		const { error } = await authClient.sendVerificationEmail({ email, callbackURL });
		setIsResending(false);

		if (error) {
			toast.error(error.message || t`We could not send the verification email. Please try again.`);
			return;
		}

		toast.success(t`Verification email sent.`);
	};

	return (
		<>
			<div className="space-y-1 text-center">
				<h1 className="font-semibold text-2xl tracking-tight">
					<Trans>Verify your email</Trans>
				</h1>
				<p className="text-muted-foreground">
					<Trans>Check your inbox for the verification link required to activate your account.</Trans>
				</p>
			</div>

			<Alert>
				<AlertTitle>
					<Trans>Email verification is required.</Trans>
				</AlertTitle>
				<AlertDescription>
					<Trans>
						If this address is new, we sent a verification link. If you already have an account, sign in instead.
					</Trans>
				</AlertDescription>
			</Alert>

			<div className="space-y-3">
				<Button className="w-full" disabled={isResending} onClick={() => void resendVerificationEmail()}>
					{isResending ? <Trans>Sending...</Trans> : <Trans>Resend verification email</Trans>}
				</Button>
				<div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
					<Button variant="link" className="h-auto px-1! py-0" onClick={onUseDifferentEmail}>
						<Trans>Use a different email</Trans>
					</Button>
					<Button
						variant="link"
						nativeButton={false}
						className="h-auto gap-1.5 px-1! py-0"
						render={
							<Link to="/auth/login" search={pendingPlan ? { plan: pendingPlan } : {}}>
								<Trans>Sign in instead</Trans>
								<ArrowRightIcon />
							</Link>
						}
					/>
				</div>
			</div>
		</>
	);
}
