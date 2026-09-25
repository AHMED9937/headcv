import * as React from "react";
import {
	Body,
	Button,
	Container,
	Font,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	pixelBasedPreset,
	Section,
	Tailwind,
	Text,
} from "react-email";

void React;

const appName = "HeadCV";
const logoUrl = "https://headcv.com/icon/dark.svg";

const colors = {
	bg: "#f5efe6",
	card: "#ffffff",
	border: "#d9d0c3",
	primary: "#1e3a5f",
	primaryDark: "#152642",
	accent: "#c9a227",
	text: "#1e293b",
	muted: "#5c6a7a",
};

interface AuthEmailLayoutProps {
	preview: string;
	eyebrow: string;
	heading: string;
	intro: string;
	details?: string;
	actionLabel: string;
	actionUrl: string;
	outro: string;
}

function AuthEmailLayout({
	preview,
	eyebrow,
	heading,
	intro,
	details,
	actionLabel,
	actionUrl,
	outro,
}: AuthEmailLayoutProps) {
	return (
		<Html lang="en">
			<Tailwind
				config={{
					presets: [pixelBasedPreset],
					theme: {
						fontFamily: {
							body: ["Inter", "-apple-system", "Segoe UI", "Arial", "sans-serif"],
							heading: ["Playfair Display", "Georgia", "Times New Roman", "serif"],
						},
					},
				}}
			>
				<Head>
					<Font
						fontFamily="Inter"
						fallbackFontFamily={["Arial", "sans-serif"]}
						fontWeight={400}
						fontStyle="normal"
						webFont={{
							url: "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2",
							format: "woff2",
						}}
					/>
					<Font
						fontFamily="Inter"
						fallbackFontFamily={["Arial", "sans-serif"]}
						fontWeight={600}
						fontStyle="normal"
						webFont={{
							url: "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2",
							format: "woff2",
						}}
					/>
					<Font
						fontFamily="Playfair Display"
						fallbackFontFamily={["Georgia", "serif"]}
						fontWeight={600}
						fontStyle="normal"
						webFont={{
							url: "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFiD-vYSZviVYUb_rj3ij__anPXDTzYgA.woff2",
							format: "woff2",
						}}
					/>
				</Head>

				<Body className="m-0 p-0 font-body text-[#1e293b] text-[15px] leading-6" style={{ backgroundColor: colors.bg }}>
					<Preview>{preview}</Preview>
					<Container className="mx-auto w-full max-w-[560px] px-4 py-10">
						<Section className="text-center">
							<Img src={logoUrl} alt={appName} width="44" height="44" className="mx-auto rounded-xl" />
							<Text className="mt-3 mb-0 font-heading font-semibold text-[#1e3a5f] text-[22px] leading-7 tracking-tight">
								{appName}
							</Text>
						</Section>

						<Section
							className="mt-6 rounded-xl border border-solid px-8 py-10"
							style={{ backgroundColor: colors.card, borderColor: colors.border }}
						>
							<Text className="m-0 font-body font-semibold text-[#5c6a7a] text-[11px] uppercase leading-4 tracking-[0.16em]">
								{eyebrow}
							</Text>

							<Heading className="mt-3 mb-0 font-heading font-semibold text-[#152642] text-[30px] leading-9 tracking-tight">
								{heading}
							</Heading>

							<Hr className="mx-0 my-5 w-12 border-solid" style={{ borderColor: colors.accent, borderWidth: 2 }} />

							<Text className="m-0 text-[#1e293b] text-[15px] leading-6">{intro}</Text>

							{details ? <Text className="mt-3 mb-0 text-[#5c6a7a] text-[14px] leading-6">{details}</Text> : null}

							<Button
								target="_blank"
								href={actionUrl}
								className="mt-8 box-border inline-block rounded-lg px-8 py-3.5 text-center font-body font-semibold text-[15px] text-white no-underline"
								style={{ backgroundColor: colors.primary }}
							>
								{actionLabel}
							</Button>

							<Section
								className="mt-8 rounded-lg border border-solid px-4 py-3"
								style={{ backgroundColor: colors.bg, borderColor: colors.border }}
							>
								<Text className="m-0 text-[#5c6a7a] text-[12px] leading-5">
									If the button does not work, copy and paste this link into your browser:
								</Text>
								<Link
									className="break-all text-[12px] leading-5 underline underline-offset-2"
									style={{ color: colors.primary }}
									href={actionUrl}
								>
									{actionUrl}
								</Link>
							</Section>

							<Text className="mt-6 mb-0 text-[#5c6a7a] text-[13px] leading-5">{outro}</Text>
						</Section>

						<Section className="mt-8 text-center">
							<Text className="m-0 text-[#5c6a7a] text-[12px] leading-5">
								This is an automated account-security email from {appName}. Please do not reply.
							</Text>
							<Text className="mt-2 mb-0 text-[#5c6a7a] text-[12px] leading-5">
								<span style={{ color: colors.accent }}>●</span> {appName} · Craft a resume that gets you hired
							</Text>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}

interface ResetPasswordEmailProps {
	url: string;
}

export function ResetPasswordEmail({ url }: ResetPasswordEmailProps) {
	return (
		<AuthEmailLayout
			preview={`Reset your ${appName} password`}
			eyebrow="Account Security"
			heading="Reset your password"
			intro={`We received a request to reset your ${appName} password.`}
			details="If this was not you, you can ignore this message and your password will remain unchanged."
			actionLabel="Create New Password"
			actionUrl={url}
			outro="For security, only use links from emails sent by HeadCV."
		/>
	);
}

interface VerifyEmailProps {
	url: string;
}

export function VerifyEmail({ url }: VerifyEmailProps) {
	return (
		<AuthEmailLayout
			preview={`Verify your email for ${appName}`}
			eyebrow="Account Verification"
			heading="Verify your email"
			intro={`Thanks for signing up for ${appName}. Please verify your email address to continue.`}
			details="Verification helps us protect your account and keep your sign-in secure."
			actionLabel="Verify Email"
			actionUrl={url}
			outro="If you did not create this account, you can safely ignore this email."
		/>
	);
}

interface VerifyEmailChangeProps {
	url: string;
	previousEmail: string;
	newEmail: string;
}

export function VerifyEmailChange({ url, previousEmail, newEmail }: VerifyEmailChangeProps) {
	return (
		<AuthEmailLayout
			preview={`Confirm your new ${appName} email address`}
			eyebrow="Account Security"
			heading="Confirm email change"
			intro={`You requested to change your ${appName} email from ${previousEmail} to ${newEmail}.`}
			details="Confirm this change to complete the update and keep your account access uninterrupted."
			actionLabel="Verify New Email"
			actionUrl={url}
			outro="If you did not request this change, ignore this email and secure your account."
		/>
	);
}
