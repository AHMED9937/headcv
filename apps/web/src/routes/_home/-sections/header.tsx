import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { ArrowRightIcon, ListIcon, TranslateIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { m, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef } from "react";
import { Button } from "@headcv/ui/components/button";
import { LocaleCombobox } from "@/features/locale/combobox";
import { LandingBrand } from "./landing-brand";

export function Header() {
	const y = useMotionValue(0);
	const lastScroll = useRef(0);
	const ticking = useRef(false);
	const springY = useSpring(y, { stiffness: 300, damping: 40 });

	useEffect(() => {
		if (typeof window === "undefined") return;

		function onScroll() {
			const current = window.scrollY ?? 0;
			if (!ticking.current) {
				window.requestAnimationFrame(() => {
					if (
						current > 32 &&
						current > lastScroll.current &&
						!window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
						!document.querySelector("header:focus-within, header details[open]")
					) {
						// Scrolling down, hide
						y.set(-100);
					} else {
						// Scrolling up, show
						y.set(0);
					}
					lastScroll.current = current;
					ticking.current = false;
				});
				ticking.current = true;
			}
		}

		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, [y]);

	const links = [
		{ href: "/#templates", label: t({ id: "home.nav.templates", message: "Templates" }) },
		{ href: "/#features", label: t({ id: "home.nav.how", message: "How it works" }) },
		{ href: "/#pricing", label: t({ id: "home.nav.pricing", message: "Pricing" }) },
		{ href: "/#faq", label: t({ id: "home.nav.faq", message: "FAQ" }) },
	];

	return (
		<m.header
			style={{ y: springY }}
			className="fixed inset-x-0 top-0 z-50 border-transparent border-b bg-background/80 backdrop-blur-lg transition-colors"
			initial={false}
		>
			<nav
				aria-label={t`Main navigation`}
				className="mx-auto flex min-h-18 max-w-7xl items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8"
			>
				<Link
					to="/"
					className="flex min-h-11 items-center gap-2 rounded-lg focus-visible:ring-2 focus-visible:ring-ring"
					aria-label={t({ id: "home.brand", message: "HeadCV home" })}
				>
					<LandingBrand />
				</Link>
				<div className="mx-auto hidden items-center gap-5 lg:flex">
					{links.map((link) => (
						<a
							key={link.href}
							href={link.href}
							className="flex min-h-11 items-center rounded-md font-medium text-muted-foreground text-sm hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
						>
							{link.label}
						</a>
					))}
				</div>
				<div className="ms-auto flex items-center gap-1 sm:gap-2">
					<LocaleCombobox
						render={
							<Button size="icon" variant="ghost" aria-label={t`Change language`}>
								<TranslateIcon />
							</Button>
						}
					/>

					<Button
						nativeButton={false}
						variant="ghost"
						className="hidden min-h-11 sm:inline-flex"
						render={<Link to="/auth/login" />}
					>
						<Trans id="home.signIn">Sign in</Trans>
					</Button>
					<Button
						nativeButton={false}
						className="hidden min-h-11 px-4 sm:inline-flex"
						render={<Link to="/templates" search={{}} />}
					>
						<Trans id="home.start">Start now</Trans>
						<ArrowRightIcon aria-hidden="true" className="rtl-flip" />
					</Button>
					<details className="relative lg:hidden">
						<summary className="flex size-11 cursor-pointer list-none items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
							<ListIcon aria-hidden="true" className="size-6" />
							<span className="sr-only">
								<Trans id="home.menu">Navigation menu</Trans>
							</span>
						</summary>
						<div className="absolute inset-e-0 top-full mt-3 w-60 max-w-[calc(100vw-2rem)] rounded-xl border bg-card p-3 shadow-lg">
							{links.map((link) => (
								<a
									key={link.href}
									href={link.href}
									onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}
									className="flex min-h-11 items-center rounded-md px-3 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
								>
									{link.label}
								</a>
							))}
							<Link
								to="/templates"
								search={{}}
								className="flex min-h-11 items-center rounded-md bg-primary px-3 text-primary-foreground"
							>
								<Trans id="home.start">Start now</Trans>
							</Link>
							<Link to="/auth/login" className="flex min-h-11 items-center px-3">
								<Trans id="home.signIn">Sign in</Trans>
							</Link>
						</div>
					</details>
				</div>
			</nav>
		</m.header>
	);
}
