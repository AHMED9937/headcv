import { createFileRoute } from "@tanstack/react-router";
import { AuthErrorPage } from "@/features/auth/pages/auth-error";

// Better Auth redirects failed OAuth callbacks here (onAPIError.errorURL) with ?error=<code>.
export const Route = createFileRoute("/auth/error")({
	component: AuthErrorPage,
	validateSearch: (search: Record<string, unknown>) => ({
		error: typeof search.error === "string" ? search.error : undefined,
	}),
});
