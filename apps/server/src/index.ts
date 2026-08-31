import { serve } from "@hono/node-server";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createApp, VERSION } from "./app.js";
import { World } from "./world.js";
import { PgStore } from "./pg-store.js";
import { COMBAT_RULES_VERSION, validateBattleContent } from "@dragonwake/combat";
import { contentIntegrityIssues, getFormulas } from "@dragonwake/content";

// Load .env lightly (no dotenv dep)
function loadEnvFile() {
  const p = resolve(process.cwd(), ".env");
  const root = resolve(process.cwd(), "../../.env");
  for (const file of [p, root]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      const key = m[1]!;
      let val = m[2]!.trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

loadEnvFile();

// ── Content integrity gate (fail loud at boot, not silently mid-battle) ────
{
  const issues = contentIntegrityIssues();
  for (const w of issues.filter((i) => i.severity === "warning")) {
    console.warn(`[content] warning: ${w.file} ${w.where}: ${w.problem}`);
  }
  const errors = issues.filter((i) => i.severity === "error");
  const battleProblems = validateBattleContent();
  if (battleProblems.length > 0 || errors.length > 0) {
    for (const e of errors) {
      console.error(`[content] ${e.file} ${e.where}: ${e.problem}`);
    }
    for (const p of battleProblems) console.error(`[combat] ${p}`);
    throw new Error(
      `content integrity failure: ${errors.length} content error(s), ${battleProblems.length} matchup problem(s)`,
    );
  }
  // Governance consistency: the two version stamps must agree.
  if (getFormulas().rulesVersion !== COMBAT_RULES_VERSION) {
    console.warn(
      `[combat] rulesVersion mismatch: combat=${COMBAT_RULES_VERSION} content/formulas.json=${getFormulas().rulesVersion}`,
    );
  }
}

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "0.0.0.0";

const world = new World({
  devFastTime: process.env.DEV_FAST_TIME !== "0",
  skipTutorial: process.env.DEV_SKIP_TUTORIAL === "1",
});

// Postgres: real load/save when DATABASE_URL is reachable
const pgUrl = process.env.DATABASE_URL;
if (pgUrl) {
  try {
    const store = await PgStore.connect(pgUrl);
    if (store) {
      await world.attachStore(store);
      console.log(
        `[dragonwake-server] postgres attached players=${world.players.size} cities=${world.cities.size}`,
      );
    } else {
      console.warn(
        "[dragonwake-server] DATABASE_URL set but unreachable — memory world",
      );
    }
  } catch (e) {
    console.warn(
      "[dragonwake-server] postgres init failed, memory fallback:",
      e instanceof Error ? e.message : e,
    );
  }
}

const app = createApp(world);

// Sim loop + persist
const simInterval = setInterval(() => {
  try {
    world.tick();
    void world.flush();
  } catch (e) {
    console.error("[sim]", e);
  }
}, 1000);

console.log(
  `[dragonwake-server] ${VERSION} listening on http://${HOST}:${PORT} db=${world.dbMode} fast=${world.devFastTime}`,
);
const server = serve({ fetch: app.fetch, port: PORT, hostname: HOST });

// Graceful shutdown — flush the last delta instead of losing it.
let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[dragonwake-server] ${signal} received — flushing…`);
  clearInterval(simInterval);
  try {
    await world.flush();
    server.close();
    await world.store?.close?.();
  } catch (e) {
    console.error("[shutdown]", e);
  } finally {
    process.exit(0);
  }
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
