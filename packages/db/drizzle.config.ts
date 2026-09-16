import { defineConfig } from "drizzle-kit";

// Drizzle Kit and schema migrations should run against a direct (unpooled)
// connection because session-level features used by migration tooling are not
// supported by PgBouncer-style connection poolers.
const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "";

export default defineConfig({
	schema: "./src/schema/index.ts",
	out: "../../migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: connectionString,
	},
});
