import { RouterProvider } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrandIcon } from "@headcv/ui/components/brand-icon";
import { installStaleChunkRecovery } from "./libs/stale-chunk-recovery";
import { getRouter } from "./router";
import "./polyfills/map-upsert";
import "./index.css";

// Recover a stale client that survives a deploy and 404s on old route chunks.
installStaleChunkRecovery();

type Router = Awaited<ReturnType<typeof getRouter>>;

function App() {
	const [router, setRouter] = useState<Router | null>(null);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		getRouter()
			.then(setRouter)
			.catch((err) => {
				setError(err instanceof Error ? err : new Error(String(err)));
			});
	}, []);

	if (error) {
		return (
			<div className="mx-auto flex h-svh max-w-md flex-col items-center justify-center gap-y-4 px-4 text-center">
				<BrandIcon variant="logo" className="h-10 w-auto" />
				<p className="text-muted-foreground">{error.message}</p>
				<button
					type="button"
					onClick={() => window.location.reload()}
					className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
				>
					Reload
				</button>
			</div>
		);
	}

	if (!router) {
		return (
			<div className="fixed inset-0 z-50 flex h-svh w-svw items-center justify-center gap-x-3 bg-background">
				<div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
				<p className="text-muted-foreground">Loading…</p>
			</div>
		);
	}

	return <RouterProvider router={router} />;
}

const rootElement = document.getElementById("app");
if (!rootElement) throw new Error("Root element not found");

if (!rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(<App />);
}
