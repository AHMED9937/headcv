import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PoolConfig } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@headcv/env/server";
import { relations } from "./relations";

declare global {
	var __pool: Pool | undefined;
	var __drizzle: NodePgDatabase<typeof relations> | undefined;
}

const SSL_MODE_PARAMS = [
	"sslmode",
	"sslnegotiation",
	"channel_binding",
	"sslcert",
	"sslkey",
	"sslrootcert",
	"sslcrl",
	"sslpassword",
];

function isNeonHost(hostname: string) {
	return hostname.endsWith(".neon.tech") || hostname.includes("-pooler.") || hostname.includes(".aws.neon.tech");
}

function inferSslConfig(url: URL): PoolConfig["ssl"] {
	const sslmode = url.searchParams.get("sslmode");

	if (!sslmode) {
		// Local Postgres typically does not require TLS. For Neon, require it.
		return isNeonHost(url.hostname) ? { rejectUnauthorized: false } : false;
	}

	switch (sslmode) {
		case "disable":
			return false;
		case "allow":
		case "prefer":
			return true;
		case "require":
			return { rejectUnauthorized: false };
		case "verify-ca":
		case "verify-full":
			return { rejectUnauthorized: true };
		default:
			return { rejectUnauthorized: false };
	}
}

function cleanConnectionString(connectionString: string) {
	const url = new URL(connectionString);
	const ssl = inferSslConfig(url);

	// node-postgres does not consistently parse SSL parameters from the query string,
	// so we strip them and supply an explicit `ssl` option instead.
	for (const param of SSL_MODE_PARAMS) {
		url.searchParams.delete(param);
	}

	return { connectionString: url.toString(), ssl };
}

export function getPoolConfig(connectionString = env.DATABASE_URL): PoolConfig {
	const { connectionString: cleanedConnectionString, ssl } = cleanConnectionString(connectionString);

	return {
		connectionString: cleanedConnectionString,
		ssl,
		min: env.DATABASE_POOL_MIN,
		max: env.DATABASE_POOL_MAX,
		// Give Neon (and any remote Postgres) a bit more time to establish a TLS connection.
		connectionTimeoutMillis: 10_000,
	};
}

function getMigrationConnectionString() {
	return env.DATABASE_URL_UNPOOLED ?? env.DATABASE_URL;
}

export function getMigrationPoolConfig(): PoolConfig {
	return getPoolConfig(getMigrationConnectionString());
}

export function getPool() {
	if (!globalThis.__pool) {
		const pool = new Pool(getPoolConfig());
		attachDatabasePool(pool);
		globalThis.__pool = pool;
	}
	return globalThis.__pool;
}

function makeDrizzleClient() {
	return drizzle({ client: getPool(), relations });
}

export function createDatabase() {
	if (!globalThis.__drizzle) {
		globalThis.__drizzle = makeDrizzleClient();
	}
	return globalThis.__drizzle;
}

export const db = createDatabase();
