import { Link, Outlet } from "@tanstack/react-router";
import { BrandIcon } from "@headcv/ui/components/brand-icon";

export function AuthLayout() {
	return (
		<div className="mx-auto flex h-svh w-dvw max-w-sm flex-col justify-center gap-y-6 px-4 xs:px-0">
			<Link to="/" aria-label="HeadCV home" className="self-center transition-opacity hover:opacity-80">
				<BrandIcon className="mb-4 h-10 w-auto" />
			</Link>

			<Outlet />
		</div>
	);
}
