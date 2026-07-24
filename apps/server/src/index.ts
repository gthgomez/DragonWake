import { serve } from "@hono/node-server";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createApp, VERSION } from "./app.js";
import { World } from "./world.js";
import { PgStore } from "./pg-store.js";

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
        `[tideforge-server] postgres attached players=${world.players.size} cities=${world.cities.size}`,
      );
    } else {
      console.warn(
        "[tideforge-server] DATABASE_URL set but unreachable — memory world",
      );
    }
  } catch (e) {
    console.warn(
      "[tideforge-server] postgres init failed, memory fallback:",
      e instanceof Error ? e.message : e,
    );
  }
}

const app = createApp(world);

// Sim loop + persist
setInterval(() => {
  try {
    world.tick();
    void world.flush();
  } catch (e) {
    console.error("[sim]", e);
  }
}, 1000);

console.log(
  `[tideforge-server] ${VERSION} listening on http://${HOST}:${PORT} db=${world.dbMode} fast=${world.devFastTime}`,
);
serve({ fetch: app.fetch, port: PORT, hostname: HOST });
