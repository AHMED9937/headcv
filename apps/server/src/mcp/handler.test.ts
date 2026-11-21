import { beforeEach, describe, expect, it, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const mocks = vi.hoisted(() => ({
	authenticateRequest: vi.fn(),
	createMcpServer: vi.fn(),
}));

vi.mock("./auth", () => ({
	AuthError: class AuthError extends Error {},
	authenticateRequest: mocks.authenticateRequest,
}));

vi.mock("./server", () => ({
	createMcpServer: mocks.createMcpServer,
}));

vi.mock("@headcv/env/server", () => ({
	env: { APP_URL: "http://localhost:3000" },
}));

beforeEach(() => {
	vi.clearAllMocks();
	mocks.authenticateRequest.mockResolvedValue(undefined);
	mocks.createMcpServer.mockImplementation(async () => new McpServer({ name: "headcv-test", version: "0.0.0" }));
});

describe("handleMcp", () => {
	it("answers GET with 405 instead of opening an SSE stream that never closes", async () => {
		const { handleMcp } = await import("./handler");

		const response = await handleMcp(
			new Request("http://localhost:3000/mcp", {
				method: "GET",
				headers: { accept: "text/event-stream" },
			}),
		);

		try {
			expect(response.status).toBe(405);
			expect(response.headers.get("allow")).toBe("POST");
			expect(response.headers.get("content-type") ?? "").not.toContain("text/event-stream");
			expect(mocks.authenticateRequest).not.toHaveBeenCalled();
			expect(mocks.createMcpServer).not.toHaveBeenCalled();
		} finally {
			await response.body?.cancel();
		}
	});

	it("still serves POST requests through the MCP transport", async () => {
		const { handleMcp } = await import("./handler");

		const response = await handleMcp(
			new Request("http://localhost:3000/mcp", {
				method: "POST",
				headers: {
					accept: "application/json, text/event-stream",
					"content-type": "application/json",
				},
				body: JSON.stringify({
					jsonrpc: "2.0",
					id: 1,
					method: "initialize",
					params: {
						protocolVersion: "2025-06-18",
						capabilities: {},
						clientInfo: { name: "test-client", version: "0.0.0" },
					},
				}),
			}),
		);

		expect(response.status).toBe(200);
		expect(mocks.authenticateRequest).toHaveBeenCalledOnce();
		await expect(response.json()).resolves.toMatchObject({
			jsonrpc: "2.0",
			id: 1,
			result: { serverInfo: { name: "headcv-test" } },
		});
	});
});
