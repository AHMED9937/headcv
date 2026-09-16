import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { AgentThreadWorkspace } from "./-components/thread-workspace";

const threadSearchSchema = z.object({
	draft: z.string().optional(),
});

export const Route = createFileRoute("/agent/$threadId")({
	component: RouteComponent,
	validateSearch: threadSearchSchema,
});

function RouteComponent() {
	const { threadId } = Route.useParams();
	const { draft } = Route.useSearch();

	return <AgentThreadWorkspace threadId={threadId} draft={draft} />;
}
