/**
 * Optional Postgres helpers — schema apply for T7 / restart durability path.
 * Game sim uses in-process World; when PG is available we verify schema exists.
 */
import pg from "pg";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const { Client } = pg;

export async function tryConnectPg(url: string): Promise<pg.Client | null> {
  const client = new Client({ connectionString: url, connectionTimeoutMillis: 3000 });
  try {
    await client.connect();
    return client;
  } catch {
    try {
      await client.end();
    } catch {
      /* ignore */
    }
    return null;
  }
}

export async function applySchemaIfNeeded(client: pg.Client): Promise<void> {
  const check = await client.query(
    `SELECT to_regclass('public.realms') IS NOT NULL AS ok`,
  );
  if (check.rows[0]?.ok) {
    return;
  }
  const schemaPath = findSchemaPath();
  if (!schemaPath) {
    throw new Error("schema.sql not found");
  }
  const sql = readFileSync(schemaPath, "utf8");
  await client.query(sql);
}

export function findSchemaPath(): string | null {
  const candidates = [
    resolve(process.cwd(), "schema.sql"),
    resolve(process.cwd(), "../../schema.sql"),
    resolve(dirname(fileURLToPath(import.meta.url)), "../../../schema.sql"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

/** Apply schema to empty DB — used by migrate script / tests. */
export async function migrate(url: string): Promise<{ ok: true; path: string }> {
  const client = await tryConnectPg(url);
  if (!client) throw new Error("cannot connect to postgres");
  try {
    // Force re-apply only if empty; if partial, drop is out of scope
    const schemaPath = findSchemaPath();
    if (!schemaPath) throw new Error("schema.sql not found");
    const check = await client.query(
      `SELECT to_regclass('public.realms') IS NOT NULL AS ok`,
    );
    if (!check.rows[0]?.ok) {
      await client.query(readFileSync(schemaPath, "utf8"));
    }
    return { ok: true, path: schemaPath };
  } finally {
    await client.end();
  }
}
