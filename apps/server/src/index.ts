import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { HealthResponse } from "@tideforge/shared";
import { getMeta, getUnits } from "@tideforge/content";
import { COMBAT_RULES_VERSION } from "@tideforge/combat";

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "0.0.0.0";
const VERSION = "0.1.0-a0";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  }),
);

app.get("/health", (c) => {
  const body: HealthResponse = {
    ok: true,
    service: "tideforge-server",
    version: VERSION,
    time: new Date().toISOString(),
  };
  return c.json(body);
});

app.get("/api/v1/content/meta", (c) => {
  try {
    return c.json({
      meta: getMeta(),
      combatRulesVersion: COMBAT_RULES_VERSION,
      unitCount: getUnits().length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: { code: "CONTENT_LOAD_FAILED", message } }, 500);
  }
});

app.get("/", (c) =>
  c.json({
    name: "Tideforge Empires API",
    version: VERSION,
    slice: "A0",
    health: "/health",
  }),
);

console.log(`[tideforge-server] listening on http://${HOST}:${PORT}`);
serve({ fetch: app.fetch, port: PORT, hostname: HOST });
