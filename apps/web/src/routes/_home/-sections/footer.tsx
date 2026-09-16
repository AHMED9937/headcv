import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { Copyright } from "@/components/ui/copyright";
import { LandingBrand } from "./landing-brand";

export function Footer() {
	const groups = [
		{
			title: t({ id: "home.footer.product", message: "Product" }),
			links: [
				{ href: "/templates", text: t({ id: "home.footer.builder", message: "Resume builder" }) },
				{ href: "/#templates", text: t({ id: "home.nav.templates", message: "Templates" }) },
				{ href: "/#pricing", text: t({ id: "home.nav.pricing", message: "Pricing" }) },
			],
		},
		{
			title: t({ id: "home.footer.explore", message: "Explore" }),
			links: [
				{ href: "/#features", text: t({ id: "home.nav.how", message: "How it works" }) },
				{ href: "/#faq", text: t({ id: "home.nav.faq", message: "FAQ" }) },
				{ href: "/auth/login", text: t({ id: "home.signIn", message: "Sign in" }) },
			],
		},
	];
	return (
		<footer
			id="footer"
			className="border-primary-foreground/20 border-t bg-primary px-4 py-12 text-primary-foreground sm:px-6 lg:px-8"
		>
			<div className="mx-auto max-w-7xl">
				<div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
					{/* Brand Column */}
					<div className="text-start sm:col-span-2 lg:col-span-1">
						<a
							href="/"
							aria-label={t({ id: "home.brand", message: "HeadCV home" })}
							className="inline-flex min-h-11 items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-ring"
						>
							<span className="rounded-lg bg-card p-1">
								<LandingBrand />
							</span>
						</a>
						<p className="mt-5 max-w-sm text-sm leading-relaxed">
							<Trans id="home.footer.text">
								HeadCV is a guided CV builder that helps you tell your story with clear layouts and a live preview.
							</Trans>
						</p>
						{/* Social Links */}
					</div>
					{/* Resources Column */}
					{/* Community Column */}
					{groups.map((group) => (
						<div key={group.title} className="text-start">
							<h2 className="font-sans font-semibold text-sm rtl:font-arabic">{group.title}</h2>
							<ul className="mt-3">
								{group.links.map((link) => (
									<li key={link.href}>
										<a
											href={link.href}
											className="inline-flex min-h-11 items-center rounded-md text-sm underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
										>
											{link.text}
										</a>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
				{/* Copyright Column */}
				<Copyright className="mt-10 border-primary-foreground/20 border-t pt-8 text-start text-primary-foreground" />
			</div>
		</footer>
	);
}
