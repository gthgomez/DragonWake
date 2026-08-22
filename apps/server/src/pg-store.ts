/**
 * PostgreSQL persistence for the in-process World.
 * Load on boot; saveWorld after mutations so data survives process restart.
 */
import pg from "pg";
import { createHash } from "node:crypto";
import { applySchemaIfNeeded, findSchemaPath, tryConnectPg } from "./pg.js";
import { getUnitById, canonTechId } from "@tideforge/content";
import type {
  Alliance,
  AllianceMember,
  BattleReport,
  Camp,
  ChatMessage,
  City,
  Commander,
  March,
  Player,
  QueueJob,
  Session,
  Sovereign,
  Tutorial,
  Wilderness,
  World,
} from "./world.js";

const { Pool } = pg;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type DbMode = "postgres" | "memory";

export class PgStore {
  readonly pool: pg.Pool;
  readonly mode: DbMode = "postgres";

  constructor(pool: pg.Pool) {
    this.pool = pool;
  }

  static async connect(url: string): Promise<PgStore | null> {
    // Probe first with short timeout
    const client = await tryConnectPg(url);
    if (!client) return null;
    try {
      await applySchemaIfNeeded(client);
    } finally {
      await client.end();
    }
    const pool = new Pool({ connectionString: url, max: 8 });
    // smoke
    await pool.query("SELECT 1");
    return new PgStore(pool);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  /** Load all realm state into an empty World (replaces seed map if data exists). */
  async loadInto(world: World): Promise<{ players: number; cities: number }> {
    const client = await this.pool.connect();
    try {
      const players = await client.query(`SELECT * FROM players WHERE realm_id = $1`, [
        world.realmId,
      ]);
      const campsR = await client.query(`SELECT * FROM camps WHERE realm_id = $1`, [
        world.realmId,
      ]);
      const wildR = await client.query(
        `SELECT * FROM wilderness_claims WHERE realm_id = $1`,
        [world.realmId],
      );

      const hasMap = campsR.rowCount && campsR.rowCount > 0;
      if (hasMap || (players.rowCount && players.rowCount > 0)) {
        // Clear seeded map; reload from DB
        world.camps.clear();
        world.wilderness.clear();
        world.usedTiles.clear();
        world.players.clear();
        world.cities.clear();
        world.sessions.clear();
        world.sessionsById.clear();
        world.sessionsByHash.clear();
        world.jobs.clear();
        world.marches.clear();
        world.reports.clear();
        world.alliances.clear();
        world.allianceMembers.clear();
        world.chat = [];
        world.sovereigns.clear();
        world.commanders.clear();
        world.inventory.clear();
        world.tutorials.clear();
      }

      for (const row of campsR.rows) {
        const c: Camp = {
          id: row.id,
          realmId: row.realm_id,
          x: row.x,
          y: row.y,
          level: row.level,
        };
        world.camps.set(c.id, c);
        world.usedTiles.add(`${c.x},${c.y}`);
      }
      for (const row of wildR.rows) {
        const w: Wilderness = {
          id: row.id,
          realmId: row.realm_id,
          x: row.x,
          y: row.y,
          level: row.level,
          resourceType: row.resource_type,
          ownerPlayerId: row.owner_player_id,
        };
        world.wilderness.set(w.id, w);
        world.usedTiles.add(`${w.x},${w.y}`);
      }

      for (const row of players.rows) {
        const p: Player = {
          id: row.id,
          realmId: row.realm_id,
          displayName: row.display_name,
          faction: row.faction,
          guestToken: row.guest_token ?? "",
          chronite: Number(row.chronite),
          playerLevel: row.player_level,
          protectionUntil: row.protection_until
            ? new Date(row.protection_until).getTime()
            : null,
          createdAt: new Date(row.created_at).getTime(),
        };
        world.players.set(p.id, p);
      }

      const cities = await client.query(`SELECT * FROM cities WHERE realm_id = $1`, [
        world.realmId,
      ]);
      for (const row of cities.rows) {
        const city: City = {
          id: row.id,
          playerId: row.player_id,
          realmId: row.realm_id,
          kind: row.kind,
          name: row.name,
          mapX: row.map_x,
          mapY: row.map_y,
          resources: {
            food: Number(row.food),
            timber: Number(row.timber),
            stone: Number(row.stone),
            iron: Number(row.iron),
            coin: Number(row.coin),
          },
          defensePosture: row.defense_posture === "harbor" ? "withdraw" : row.defense_posture === "partial" ? "garrison" : row.defense_posture,
          lastResourceTick: new Date(row.last_resource_tick).getTime(),
          lastPostureChange: Number(row.last_posture_change ?? 0),
          buildings: [],
          plots: [],
          stacks: {},
          research: {},
          population: Number(row.population ?? 0),
          maxPopulation: Number(row.max_population ?? 0),
          usedManpower: Number(row.used_manpower ?? 0),
          marchedManpower: 0,
        };
        world.cities.set(city.id, city);
        world.usedTiles.add(`${city.mapX},${city.mapY}`);
      }

      const buildings = await client.query(
        `SELECT b.* FROM buildings b JOIN cities c ON c.id = b.city_id WHERE c.realm_id = $1`,
        [world.realmId],
      );
      for (const row of buildings.rows) {
        const city = world.cities.get(row.city_id);
        if (!city) continue;
        city.buildings.push({
          slotIndex: row.slot_index,
          buildingType: row.building_type,
          level: row.level,
        });
      }

      const plots = await client.query(
        `SELECT f.* FROM field_plots f JOIN cities c ON c.id = f.city_id WHERE c.realm_id = $1`,
        [world.realmId],
      );
      for (const row of plots.rows) {
        const city = world.cities.get(row.city_id);
        if (!city) continue;
        city.plots.push({
          slotIndex: row.slot_index,
          plotType: row.plot_type,
          level: row.level,
        });
      }

      const stacks = await client.query(
        `SELECT u.* FROM unit_stacks u JOIN cities c ON c.id = u.city_id WHERE c.realm_id = $1`,
        [world.realmId],
      );
      for (const row of stacks.rows) {
        const city = world.cities.get(row.city_id);
        if (!city) continue;
        city.stacks[row.unit_id] = Number(row.count);
      }

      const research = await client.query(
        `SELECT r.* FROM research_levels r JOIN cities c ON c.id = r.city_id WHERE c.realm_id = $1`,
        [world.realmId],
      );
      for (const row of research.rows) {
        const city = world.cities.get(row.city_id);
        if (!city) continue;
        // Legacy aquatic tech ids map to their medieval successors on load.
        const techId = canonTechId(String(row.tech_id));
        city.research[techId] = Math.max(city.research[techId] ?? 0, Number(row.level) || 0);
      }

      const sessions = await client.query(
        `SELECT s.* FROM sessions s JOIN players p ON p.id = s.player_id WHERE p.realm_id = $1`,
        [world.realmId],
      );
      for (const row of sessions.rows) {
        const s: Session = {
          id: row.id,
          playerId: row.player_id,
          token: "", // raw token not stored; auth uses hash
          tokenHash: row.token_hash,
          expiresAt: new Date(row.expires_at).getTime(),
        };
        world.sessionsById.set(s.id, s);
        world.sessionsByHash.set(row.token_hash, s);
      }

      const jobs = await client.query(
        `SELECT j.* FROM queue_jobs j JOIN players p ON p.id = j.player_id WHERE p.realm_id = $1`,
        [world.realmId],
      );
      for (const row of jobs.rows) {
        const j: QueueJob = {
          id: row.id,
          cityId: row.city_id,
          playerId: row.player_id,
          kind: row.kind,
          payload: row.payload,
          startedAt: new Date(row.started_at).getTime(),
          finishesAt: new Date(row.finishes_at).getTime(),
          status: row.status,
        };
        world.jobs.set(j.id, j);
      }

      const reports = await client.query(
        `SELECT * FROM battle_reports WHERE realm_id = $1`,
        [world.realmId],
      );
      for (const row of reports.rows) {
        const r: BattleReport = {
          id: row.id,
          realmId: row.realm_id,
          marchId: row.march_id,
          attackerPlayerId: row.attacker_player_id,
          defenderPlayerId: row.defender_player_id,
          result: row.result,
          createdAt: new Date(row.created_at).getTime(),
        };
        world.reports.set(r.id, r);
      }

      // Commanders BEFORE marches (march rows reference commander ids).
      const cmdRows = await client.query(
        `SELECT c.* FROM commanders c JOIN players p ON p.id = c.player_id WHERE p.realm_id = $1`,
        [world.realmId],
      );
      for (const row of cmdRows.rows) {
        const cmd: Commander = {
          id: row.id,
          playerId: row.player_id,
          name: row.name,
          stars: row.stars,
          leadership: Number(row.leadership),
          attack: Number(row.attack),
          defense: Number(row.defense),
          life: Number(row.life),
          xp: Number(row.xp ?? 0),
          busyMarchId: row.busy_march_id ?? null,
          woundedUntil: row.wounded_until
            ? new Date(row.wounded_until).getTime()
            : null,
        };
        world.commanders.set(cmd.id, cmd);
      }

      const marches = await client.query(`SELECT * FROM marches WHERE realm_id = $1`, [
        world.realmId,
      ]);
      for (const row of marches.rows) {
        const raw = (row.composition ?? {}) as Record<string, unknown>;
        const cargo =
          raw.__cargo && typeof raw.__cargo === "object"
            ? (raw.__cargo as March["cargo"])
            : {};
        const composition: Record<string, number> = {};
        for (const [k, v] of Object.entries(raw)) {
          if (k === "__cargo") continue;
          if (typeof v === "number") composition[k] = v;
        }
        const m: March = {
          id: row.id,
          realmId: row.realm_id,
          playerId: row.player_id,
          fromCityId: row.from_city_id,
          commanderId: row.commander_id,
          sovereignId: row.sovereign_id,
          intent: row.intent,
          targetType: row.target_type,
          targetId: row.target_id,
          targetX: row.target_x,
          targetY: row.target_y,
          composition,
          cargo,
          departAt: new Date(row.depart_at).getTime(),
          arriveAt: new Date(row.arrive_at).getTime(),
          returnAt: row.return_at ? new Date(row.return_at).getTime() : null,
          status: row.status,
          battleReportId: row.battle_report_id,
          landCount: row.status === "en_route" ? 0 : 1,
        };
        world.marches.set(m.id, m);
      }

      const sovs = await client.query(
        `SELECT s.* FROM sovereigns s JOIN players p ON p.id = s.player_id WHERE p.realm_id = $1`,
        [world.realmId],
      );
      for (const row of sovs.rows) {
        const s: Sovereign = {
          id: row.id,
          playerId: row.player_id,
          sovereignType: row.sovereign_type,
          level: row.level,
          woundedUntil: row.wounded_until
            ? new Date(row.wounded_until).getTime()
            : null,
          harnessCrown: row.harness_crown,
          harnessHeart: row.harness_heart,
          harnessGrasp: row.harness_grasp,
          harnessKeel: row.harness_keel,
        };
        world.sovereigns.set(s.id, s);
      }

      const items = await client.query(
        `SELECT i.* FROM item_stacks i JOIN players p ON p.id = i.player_id WHERE p.realm_id = $1`,
        [world.realmId],
      );
      for (const row of items.rows) {
        const inv = world.inventory.get(row.player_id) ?? {};
        inv[row.item_id] = Number(row.count);
        world.inventory.set(row.player_id, inv);
      }

      const tuts = await client.query(
        `SELECT t.* FROM tutorial_progress t JOIN players p ON p.id = t.player_id WHERE p.realm_id = $1`,
        [world.realmId],
      );
      for (const row of tuts.rows) {
        const t: Tutorial = {
          playerId: row.player_id,
          step: row.step,
          completed: row.completed,
        };
        world.tutorials.set(t.playerId, t);
      }

      // Bestiary entries
      const bestRows = await client.query(
        `SELECT * FROM bestiary_entries WHERE player_id IN (SELECT id FROM players WHERE realm_id = $1)`,
        [world.realmId],
      );
      for (const row of bestRows.rows) {
        const key = `${row.player_id}:${row.entry_id}`;
        world.bestiary.set(key, {
          entryId: row.entry_id,
          observationLevel: row.observation_level,
          encounterCount: row.encounter_count,
        });
      }

      // Dragon progress
      const dpRows = await client.query(
        `SELECT * FROM dragon_progress WHERE player_id IN (SELECT id FROM players WHERE realm_id = $1)`,
        [world.realmId],
      );
      for (const row of dpRows.rows) {
        world.dragonProgress.set(row.player_id, {
          bestiaryStudied: row.bestiary_studied,
          researchLevel: row.research_level,
          materialsCollected: row.materials_collected,
          campTypesDefeated: new Set(row.camp_types_defeated ?? []),
          expeditionStage: row.expedition_stage,
          charterEarned: row.charter_earned,
          campsDefeated: Number(row.camps_defeated ?? 0),
          scoutsSent: Number(row.scouts_sent ?? 0),
        });
      }

      // Daily quest + clue-cap state. Clear first (stale rows must never
      // survive a reload), then hydrate only rows whose day_key matches the
      // current UTC day — ensureDaily/ensureDailyClueUsage tolerate absence.
      world.dailyQuests.clear();
      world.dailyClues.clear();
      const todayKey = new Date().toISOString().slice(0, 10);
      const dailyRows = await client.query(
        `SELECT * FROM daily_state WHERE player_id IN (SELECT id FROM players WHERE realm_id = $1)`,
        [world.realmId],
      );
      for (const row of dailyRows.rows) {
        if (row.day_key !== todayKey) continue;
        if (row.quests && typeof row.quests === "object") {
          const q = row.quests as {
            dayKey?: unknown;
            done?: Record<string, boolean>;
            claimed?: Record<string, boolean>;
          };
          world.dailyQuests.set(row.player_id, {
            dayKey:
              typeof q.dayKey === "string" ? q.dayKey : String(row.day_key),
            done: { ...(q.done ?? {}) },
            claimed: { ...(q.claimed ?? {}) },
          });
        }
        world.dailyClues.set(row.player_id, {
          dayKey: String(row.day_key),
          used: Number(row.clue_used ?? 0),
        });
      }

      const allies = await client.query(`SELECT * FROM alliances WHERE realm_id = $1`, [
        world.realmId,
      ]);
      for (const row of allies.rows) {
        const a: Alliance = {
          id: row.id,
          realmId: row.realm_id,
          name: row.name,
          tag: row.tag,
          leaderId: row.leader_id,
        };
        world.alliances.set(a.id, a);
      }
      const members = await client.query(
        `SELECT m.* FROM alliance_members m JOIN alliances a ON a.id = m.alliance_id WHERE a.realm_id = $1`,
        [world.realmId],
      );
      for (const row of members.rows) {
        const m: AllianceMember = {
          allianceId: row.alliance_id,
          playerId: row.player_id,
          rank: row.rank,
        };
        world.allianceMembers.set(m.playerId, m);
      }

      const chat = await client.query(
        `SELECT * FROM chat_messages WHERE realm_id = $1 ORDER BY created_at ASC`,
        [world.realmId],
      );
      for (const row of chat.rows) {
        const msg: ChatMessage = {
          id: row.id,
          realmId: row.realm_id,
          channel: row.channel,
          allianceId: row.alliance_id,
          fromPlayerId: row.from_player_id,
          toPlayerId: row.to_player_id,
          body: row.body,
          createdAt: new Date(row.created_at).getTime(),
        };
        world.chat.push(msg);
      }

      // If no map entities at all, keep constructor seed (already present)
      if (!hasMap && world.camps.size === 0) {
        world.seedMap();
      }

      // Recompute manpower for all cities
      world.recalculateAllManpower();

      // Recompute marchedManpower for all cities
      for (const city of world.cities.values()) {
        let marchedPop = 0;
        for (const march of world.marches.values()) {
          if (march.playerId !== city.playerId || march.fromCityId !== city.id) continue;
          if (march.status !== "en_route" && march.status !== "returning") continue;
          for (const [unitId, count] of Object.entries(march.composition)) {
            const unit = getUnitById(unitId);
            if (unit) marchedPop += unit.pop * count;
          }
        }
        city.marchedManpower = marchedPop;
      }

      return {
        players: world.players.size,
        cities: world.cities.size,
      };
    } finally {
      client.release();
    }
  }

  /** Full write-through of world state (MVP-sized realm). Idempotent upserts. */
  async saveWorld(world: World): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // Ensure realm
      await client.query(
        `INSERT INTO realms (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
        [world.realmId, "Tideforge Beta"],
      );

      // Camps
      for (const c of world.camps.values()) {
        await client.query(
          `INSERT INTO camps (id, realm_id, x, y, level)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (id) DO UPDATE SET x=EXCLUDED.x, y=EXCLUDED.y, level=EXCLUDED.level`,
          [c.id, c.realmId, c.x, c.y, c.level],
        );
      }

      // Wilderness
      for (const w of world.wilderness.values()) {
        await client.query(
          `INSERT INTO wilderness_claims (id, realm_id, x, y, level, resource_type, owner_player_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (id) DO UPDATE SET
             owner_player_id=EXCLUDED.owner_player_id,
             level=EXCLUDED.level,
             resource_type=EXCLUDED.resource_type`,
          [
            w.id,
            w.realmId,
            w.x,
            w.y,
            w.level,
            w.resourceType,
            w.ownerPlayerId,
          ],
        );
      }

      // Players
      for (const p of world.players.values()) {
        await client.query(
          `INSERT INTO players (
             id, realm_id, display_name, faction, guest_token, chronite,
             player_level, protection_until, created_at
           ) VALUES (
             $1,$2,$3,$4,$5,$6,$7,
             CASE WHEN $8::float8 IS NULL THEN NULL ELSE to_timestamp($8/1000.0) END,
             to_timestamp($9/1000.0)
           )
           ON CONFLICT (id) DO UPDATE SET
             display_name=EXCLUDED.display_name,
             chronite=EXCLUDED.chronite,
             player_level=EXCLUDED.player_level,
             protection_until=EXCLUDED.protection_until,
             guest_token=EXCLUDED.guest_token`,
          [
            p.id,
            p.realmId,
            p.displayName,
            p.faction,
            p.guestToken || null,
            p.chronite,
            p.playerLevel,
            p.protectionUntil,
            p.createdAt,
          ],
        );
      }

      // Sessions — by hash
      for (const s of world.sessionsById.values()) {
        const th = s.tokenHash || (s.token ? hashToken(s.token) : null);
        if (!th) continue;
        await client.query(
          `INSERT INTO sessions (id, player_id, token_hash, expires_at)
           VALUES ($1,$2,$3,to_timestamp($4/1000.0))
           ON CONFLICT (id) DO UPDATE SET
             token_hash=EXCLUDED.token_hash,
             expires_at=EXCLUDED.expires_at`,
          [s.id, s.playerId, th, s.expiresAt],
        );
      }

      // Cities + children
      for (const c of world.cities.values()) {
        await client.query(
          `INSERT INTO cities (
             id, player_id, realm_id, kind, name, map_x, map_y,
             food, timber, stone, iron, coin,
             defense_posture, last_posture_change, last_resource_tick, population, max_population, used_manpower
           ) VALUES (
             $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,to_timestamp($15/1000.0),$16,$17,$18
           )
           ON CONFLICT (id) DO UPDATE SET
             kind=EXCLUDED.kind,
             name=EXCLUDED.name,
             food=EXCLUDED.food,
             timber=EXCLUDED.timber,
             stone=EXCLUDED.stone,
             iron=EXCLUDED.iron,
             coin=EXCLUDED.coin,
             defense_posture=EXCLUDED.defense_posture,
             last_posture_change=EXCLUDED.last_posture_change,
             last_resource_tick=EXCLUDED.last_resource_tick,
             population=EXCLUDED.population,
             max_population=EXCLUDED.max_population,
             used_manpower=EXCLUDED.used_manpower`,
          [
            c.id,
            c.playerId,
            c.realmId,
            c.kind,
            c.name,
            c.mapX,
            c.mapY,
            c.resources.food,
            c.resources.timber,
            c.resources.stone,
            c.resources.iron,
            c.resources.coin,
            c.defensePosture,
            c.lastPostureChange,
            c.lastResourceTick,
            c.population,
            c.maxPopulation,
            c.usedManpower,
          ],
        );

        await client.query(`DELETE FROM buildings WHERE city_id = $1`, [c.id]);
        for (const b of c.buildings) {
          await client.query(
            `INSERT INTO buildings (city_id, slot_index, building_type, level)
             VALUES ($1,$2,$3,$4)`,
            [c.id, b.slotIndex, b.buildingType, b.level],
          );
        }

        await client.query(`DELETE FROM field_plots WHERE city_id = $1`, [c.id]);
        for (const p of c.plots) {
          await client.query(
            `INSERT INTO field_plots (city_id, slot_index, plot_type, level)
             VALUES ($1,$2,$3,$4)`,
            [c.id, p.slotIndex, p.plotType, p.level],
          );
        }

        await client.query(`DELETE FROM unit_stacks WHERE city_id = $1`, [c.id]);
        for (const [uid, count] of Object.entries(c.stacks)) {
          if (count <= 0) continue;
          await client.query(
            `INSERT INTO unit_stacks (city_id, unit_id, count) VALUES ($1,$2,$3)`,
            [c.id, uid, count],
          );
        }

        await client.query(`DELETE FROM research_levels WHERE city_id = $1`, [c.id]);
        for (const [tech, level] of Object.entries(c.research)) {
          await client.query(
            `INSERT INTO research_levels (city_id, tech_id, level) VALUES ($1,$2,$3)`,
            [c.id, tech, level],
          );
        }
      }

      // Jobs
      for (const j of world.jobs.values()) {
        await client.query(
          `INSERT INTO queue_jobs (
             id, city_id, player_id, kind, payload, started_at, finishes_at, status
           ) VALUES (
             $1,$2,$3,$4,$5::jsonb,to_timestamp($6/1000.0),to_timestamp($7/1000.0),$8
           )
           ON CONFLICT (id) DO UPDATE SET
             status=EXCLUDED.status,
             finishes_at=EXCLUDED.finishes_at,
             payload=EXCLUDED.payload`,
          [
            j.id,
            j.cityId,
            j.playerId,
            j.kind,
            JSON.stringify(j.payload),
            j.startedAt,
            j.finishesAt,
            j.status,
          ],
        );
      }

      // Sovereigns before marches (optional FK)
      for (const s of world.sovereigns.values()) {
        await client.query(
          `INSERT INTO sovereigns (
             id, player_id, sovereign_type, level, wounded_until,
             harness_crown, harness_heart, harness_grasp, harness_keel
           ) VALUES (
             $1,$2,$3,$4,
             CASE WHEN $5::float8 IS NULL THEN NULL ELSE to_timestamp($5/1000.0) END,
             $6,$7,$8,$9
           )
           ON CONFLICT (id) DO UPDATE SET
             level=EXCLUDED.level,
             wounded_until=EXCLUDED.wounded_until,
             harness_crown=EXCLUDED.harness_crown,
             harness_heart=EXCLUDED.harness_heart,
             harness_grasp=EXCLUDED.harness_grasp,
             harness_keel=EXCLUDED.harness_keel`,
          [
            s.id,
            s.playerId,
            s.sovereignType,
            s.level,
            s.woundedUntil,
            s.harnessCrown,
            s.harnessHeart,
            s.harnessGrasp,
            s.harnessKeel,
          ],
        );
      }

      // Commanders before marches (marches.commander_id references them)
      for (const cmd of world.commanders.values()) {
        await client.query(
          `INSERT INTO commanders (
             id, player_id, name, stars, leadership, attack, defense, life,
             busy_march_id, xp, wounded_until
           ) VALUES (
             $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
             CASE WHEN $11::float8 IS NULL THEN NULL ELSE to_timestamp($11/1000.0) END
           )
           ON CONFLICT (id) DO UPDATE SET
             name=EXCLUDED.name,
             stars=EXCLUDED.stars,
             leadership=EXCLUDED.leadership,
             attack=EXCLUDED.attack,
             defense=EXCLUDED.defense,
             life=EXCLUDED.life,
             busy_march_id=EXCLUDED.busy_march_id,
             xp=EXCLUDED.xp,
             wounded_until=EXCLUDED.wounded_until`,
          [
            cmd.id,
            cmd.playerId,
            cmd.name,
            cmd.stars,
            cmd.leadership,
            cmd.attack,
            cmd.defense,
            cmd.life,
            cmd.busyMarchId,
            cmd.xp,
            cmd.woundedUntil,
          ],
        );
      }

      // Marches first without report FK (reports reference marches)
      for (const m of world.marches.values()) {
        await client.query(
          `INSERT INTO marches (
             id, realm_id, player_id, from_city_id, commander_id, sovereign_id,
             intent, target_type, target_id, target_x, target_y, composition,
             depart_at, arrive_at, return_at, status, battle_report_id
           ) VALUES (
             $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,
             to_timestamp($13/1000.0), to_timestamp($14/1000.0),
             CASE WHEN $15::float8 IS NULL THEN NULL ELSE to_timestamp($15/1000.0) END,
             $16, NULL
           )
           ON CONFLICT (id) DO UPDATE SET
             composition=EXCLUDED.composition,
             status=EXCLUDED.status,
             return_at=EXCLUDED.return_at,
             arrive_at=EXCLUDED.arrive_at`,
          [
            m.id,
            m.realmId,
            m.playerId,
            m.fromCityId,
            m.commanderId,
            m.sovereignId,
            m.intent,
            m.targetType,
            m.targetId,
            m.targetX,
            m.targetY,
            JSON.stringify({
              ...m.composition,
              __cargo: m.cargo ?? {},
            }),
            m.departAt,
            m.arriveAt,
            m.returnAt,
            m.status,
          ],
        );
      }

      // Reports (FK → marches)
      for (const r of world.reports.values()) {
        await client.query(
          `INSERT INTO battle_reports (
             id, realm_id, march_id, attacker_player_id, defender_player_id, result, created_at
           ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,to_timestamp($7/1000.0))
           ON CONFLICT (id) DO UPDATE SET result=EXCLUDED.result, march_id=EXCLUDED.march_id`,
          [
            r.id,
            r.realmId,
            r.marchId,
            r.attackerPlayerId,
            r.defenderPlayerId,
            JSON.stringify(r.result),
            r.createdAt,
          ],
        );
      }

      // Link marches → reports
      for (const m of world.marches.values()) {
        if (!m.battleReportId) continue;
        await client.query(
          `UPDATE marches SET battle_report_id = $2, status = $3 WHERE id = $1`,
          [m.id, m.battleReportId, m.status],
        );
      }

      for (const [playerId, inv] of world.inventory.entries()) {
        await client.query(`DELETE FROM item_stacks WHERE player_id = $1`, [playerId]);
        for (const [itemId, count] of Object.entries(inv)) {
          if (count <= 0) continue;
          await client.query(
            `INSERT INTO item_stacks (player_id, item_id, count) VALUES ($1,$2,$3)`,
            [playerId, itemId, count],
          );
        }
      }

      for (const t of world.tutorials.values()) {
        await client.query(
          `INSERT INTO tutorial_progress (player_id, step, completed)
           VALUES ($1,$2,$3)
           ON CONFLICT (player_id) DO UPDATE SET step=EXCLUDED.step, completed=EXCLUDED.completed`,
          [t.playerId, t.step, t.completed],
        );
      }

      // Bestiary entries
      for (const [key, entry] of world.bestiary.entries()) {
        const [playerId, entryId] = [key.split(":")[0], key.split(":").slice(1).join(":")];
        if (!playerId || !entryId) continue;
        await client.query(
          `INSERT INTO bestiary_entries (player_id, entry_id, observation_level, encounter_count)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (player_id, entry_id) DO UPDATE SET
             observation_level=EXCLUDED.observation_level,
             encounter_count=EXCLUDED.encounter_count`,
          [playerId, entryId, entry.observationLevel, entry.encounterCount],
        );
      }

      // Dragon progress
      for (const [playerId, progress] of world.dragonProgress.entries()) {
        await client.query(
          `INSERT INTO dragon_progress (player_id, bestiary_studied, research_level, materials_collected, camp_types_defeated, expedition_stage, charter_earned, camps_defeated, scouts_sent)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (player_id) DO UPDATE SET
             bestiary_studied=EXCLUDED.bestiary_studied,
             research_level=EXCLUDED.research_level,
             materials_collected=EXCLUDED.materials_collected,
             camp_types_defeated=EXCLUDED.camp_types_defeated,
             expedition_stage=EXCLUDED.expedition_stage,
             charter_earned=EXCLUDED.charter_earned,
             camps_defeated=EXCLUDED.camps_defeated,
             scouts_sent=EXCLUDED.scouts_sent`,
          [
            playerId,
            progress.bestiaryStudied,
            progress.researchLevel,
            progress.materialsCollected,
            [...progress.campTypesDefeated],
            progress.expeditionStage,
            progress.charterEarned,
            progress.campsDefeated,
            progress.scoutsSent,
          ],
        );
      }

      // Daily quest + clue-cap state — one row per player present in either
      // map. Written as-is (upsert keeps one current-day row per player);
      // ensureDaily/ensureDailyClueUsage discard stale day keys on load.
      const dailyPlayers = new Set<string>([
        ...world.dailyQuests.keys(),
        ...world.dailyClues.keys(),
      ]);
      for (const playerId of dailyPlayers) {
        const q = world.dailyQuests.get(playerId);
        const clue = world.dailyClues.get(playerId);
        const dayKey = q?.dayKey ?? clue?.dayKey;
        if (!dayKey) continue;
        await client.query(
          `INSERT INTO daily_state (player_id, day_key, quests, clue_used)
           VALUES ($1, $2, $3::jsonb, $4)
           ON CONFLICT (player_id) DO UPDATE SET
             day_key=EXCLUDED.day_key,
             quests=EXCLUDED.quests,
             clue_used=EXCLUDED.clue_used`,
          [playerId, dayKey, JSON.stringify(q ?? null), clue?.used ?? 0],
        );
      }

      for (const a of world.alliances.values()) {
        await client.query(
          `INSERT INTO alliances (id, realm_id, name, tag, leader_id)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, tag=EXCLUDED.tag`,
          [a.id, a.realmId, a.name, a.tag, a.leaderId],
        );
      }
      // members: clear+rewrite for realm alliances
      for (const a of world.alliances.values()) {
        await client.query(`DELETE FROM alliance_members WHERE alliance_id = $1`, [
          a.id,
        ]);
      }
      for (const m of world.allianceMembers.values()) {
        await client.query(
          `INSERT INTO alliance_members (alliance_id, player_id, rank)
           VALUES ($1,$2,$3)`,
          [m.allianceId, m.playerId, m.rank],
        );
      }

      for (const msg of world.chat) {
        await client.query(
          `INSERT INTO chat_messages (
             id, realm_id, channel, alliance_id, from_player_id, to_player_id, body, created_at
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,to_timestamp($8/1000.0))
           ON CONFLICT (id) DO NOTHING`,
          [
            msg.id,
            msg.realmId,
            msg.channel,
            msg.allianceId,
            msg.fromPlayerId,
            msg.toPlayerId,
            msg.body,
            msg.createdAt,
          ],
        );
      }

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
}

// re-export findSchemaPath usage
export { findSchemaPath };
