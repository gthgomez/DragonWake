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
    await migrateExistingSchema(client);
    return;
  }
  const schemaPath = findSchemaPath();
  if (!schemaPath) {
    throw new Error("schema.sql not found");
  }
  const sql = readFileSync(schemaPath, "utf8");
  await client.query(sql);
}

/**
 * Idempotent migrations for databases created by an older schema.sql.
 * Must be safe to run on every boot. Order matters: the legacy posture
 * CHECK must be dropped BEFORE backfilling new values, then re-added.
 */
export async function migrateExistingSchema(client: pg.Client): Promise<void> {
  // 1. Population/manpower columns (pre-Slice-1A DBs).
  await client.query(`
    ALTER TABLE cities ADD COLUMN IF NOT EXISTS population INT NOT NULL DEFAULT 0;
    ALTER TABLE cities ADD COLUMN IF NOT EXISTS max_population INT NOT NULL DEFAULT 0;
    ALTER TABLE cities ADD COLUMN IF NOT EXISTS used_manpower INT NOT NULL DEFAULT 0;
  `);

  // 2. Dragon foundation tables (added after most existing volumes were created).
  await client.query(`
    CREATE TABLE IF NOT EXISTS bestiary_entries (
      player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      entry_id        TEXT NOT NULL,
      observation_level INT NOT NULL DEFAULT 0,
      encounter_count INT NOT NULL DEFAULT 0,
      PRIMARY KEY (player_id, entry_id)
    );
    CREATE TABLE IF NOT EXISTS dragon_progress (
      player_id       UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
      bestiary_studied INT NOT NULL DEFAULT 0,
      research_level  INT NOT NULL DEFAULT 0,
      materials_collected INT NOT NULL DEFAULT 0,
      camp_types_defeated TEXT[] NOT NULL DEFAULT '{}',
      expedition_stage INT NOT NULL DEFAULT 0,
      charter_earned  BOOLEAN NOT NULL DEFAULT FALSE
    );
  `);

  // 3. Defense posture legacy → modern values, then swap the CHECK constraint.
  //    Legacy rows keep their behavior via pg-store load mapping, but we
  //    normalize here so saves with 'withdraw'/'garrison' never violate.
  await client.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'cities_defense_posture_check'
          AND pg_get_constraintdef(oid) LIKE '%harbor%'
      ) THEN
        ALTER TABLE cities DROP CONSTRAINT cities_defense_posture_check;
        UPDATE cities SET defense_posture = 'withdraw' WHERE defense_posture = 'harbor';
        UPDATE cities SET defense_posture = 'garrison' WHERE defense_posture = 'partial';
        UPDATE cities SET defense_posture = 'withdraw'
          WHERE defense_posture NOT IN ('withdraw','garrison','full');
        ALTER TABLE cities ADD CONSTRAINT cities_defense_posture_check
          CHECK (defense_posture IN ('withdraw','garrison','full'));
      END IF;
    END
    $$;
  `);

  // 4. M2 resource rename: cities columns + field_plots plot types.
  //    Column renames are data-preserving; each guarded by existence check.
  await client.query(`
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN
        SELECT * FROM (VALUES
          ('kelp','food'),
          ('driftwood','timber'),
          ('basalt','stone'),
          ('slagiron','iron'),
          ('tidegilt','coin')
        ) AS m(old_name,new_name)
      LOOP
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'cities' AND column_name = r.old_name
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'cities' AND column_name = r.new_name
        ) THEN
          EXECUTE format('ALTER TABLE cities RENAME COLUMN %I TO %I', r.old_name, r.new_name);
        END IF;
      END LOOP;

      UPDATE field_plots SET plot_type = CASE plot_type
        WHEN 'kelp_farm'   THEN 'farm'
        WHEN 'drift_dock'  THEN 'lumber_yard'
        WHEN 'basalt_cut'  THEN 'quarry'
        WHEN 'slag_pit'    THEN 'mine'
        ELSE plot_type
      END
      WHERE plot_type IN ('kelp_farm','drift_dock','basalt_cut','slag_pit');
    END
    $$;
  `);

  // 5. Faction id rename: legacy aquatic ids → medieval ids, then swap the
  //    players.faction CHECK. Drop-before-update mirrors step 3: the legacy
  //    CHECK would reject the new ids while it is still attached.
  await client.query(`
    DO $$
    DECLARE
      faction_conname TEXT;
    BEGIN
      SELECT conname INTO faction_conname
        FROM pg_constraint
        WHERE conrelid = 'players'::regclass
          AND contype = 'c'
          AND conname ILIKE '%faction%'
          AND pg_get_constraintdef(oid) LIKE '%brinecant%'
        LIMIT 1;
      IF faction_conname IS NOT NULL THEN
        EXECUTE format('ALTER TABLE players DROP CONSTRAINT %I', faction_conname);
        UPDATE players SET faction = CASE faction
          WHEN 'brinecant' THEN 'northern_kingdom'
          WHEN 'ashcoil' THEN 'mountain_realm'
          WHEN 'skyshear' THEN 'forest_people'
          WHEN 'mossvault' THEN 'coastal_lords'
          ELSE faction
        END
        WHERE faction IN ('brinecant','ashcoil','skyshear','mossvault');
        EXECUTE format('ALTER TABLE players ADD CONSTRAINT %I CHECK (faction IN (%L, %L, %L, %L))',
          faction_conname,
          'northern_kingdom', 'mountain_realm', 'forest_people', 'coastal_lords');
      END IF;
    END
    $$;
  `);
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
    } else {
      await migrateExistingSchema(client);
    }
    return { ok: true, path: schemaPath };
  } finally {
    await client.end();
  }
}
