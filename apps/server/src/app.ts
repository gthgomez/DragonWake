import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import {
  COMBAT_RULES_VERSION,
} from "@dragonwake/combat";
import {
  getBestiaryEntries,
  getBuildings,
  getCitadelById,
  getCitadels,
  getDragonClues,
  getExpeditions,
  getFormulas,
  getMeta,
  getResearch,
  getResearchUnlocks,
  getShop,
  getUnits,
} from "@dragonwake/content";
import type { Faction, HealthResponse } from "@dragonwake/shared";
import { FACTIONS } from "@dragonwake/shared";
import {
  World,
  type City,
  type Commander,
  type Player,
  PLOT_TYPES,
  TUTORIAL_STEPS,
} from "./world.js";
import { LIMITS, rateLimit } from "./rate-limit.js";
import {
  adminGrantSchema,
  allianceCreateSchema,
  allianceJoinSchema,
  buildBodySchema,
  chatBodySchema,
  guestBodySchema,
  marchBodySchema,
  parseBody,
  postureBodySchema,
  researchBodySchema,
  trainBodySchema,
} from "./validate.js";

export const VERSION = "0.3.0-s1-stonekeel";

export type AppEnv = {
  Variables: {
    world: World;
    player: Player | null;
  };
};

function publicPlayer(p: Player) {
  return {
    id: p.id,
    displayName: p.displayName,
    faction: p.faction,
    chronite: p.chronite,
    playerLevel: p.playerLevel,
    protectionUntil: p.protectionUntil
      ? new Date(p.protectionUntil).toISOString()
      : null,
  };
}

function publicCity(c: City, world: World) {
  return {
    id: c.id,
    playerId: c.playerId,
    kind: c.kind,
    name: c.name,
    mapX: c.mapX,
    mapY: c.mapY,
    resources: c.resources,
    defensePosture: c.defensePosture,
    buildings: c.buildings,
    plots: c.plots,
    stacks: c.stacks,
    research: c.research,
    productionPerHour: world.effectiveProduction(c),
    ownedWilderness: world.ownedWildernessCount(c.playerId),
    population: c.population,
    maxPopulation: c.maxPopulation,
    usedManpower: c.usedManpower,
    availableManpower: Math.max(
      0,
      c.maxPopulation - c.usedManpower - c.marchedManpower,
    ),
  };
}

function err(c: { json: (b: unknown, s: number) => Response }, code: string, message: string, status = 400) {
  return c.json({ error: { code, message } }, status);
}

/**
 * Real admin gate: operators set ADMIN_TOKEN and present it via the
 * x-admin-token header. Without a configured token, admin endpoints are
 * dev-only (NODE_ENV !== "production") — never reachable in production,
 * and the old ALLOW_ADMIN=1 prod bypass is gone.
 */
function adminAuthorized(c: { req: { header: (k: string) => string | undefined } }): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (token) return c.req.header("x-admin-token") === token;
  return process.env.NODE_ENV !== "production";
}

/** Server-advertised flag so the web UI can hide dev tooling. */
function devModeEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

/** LOCKED wire shape for commanders — the web UI builds against this. */
function publicCommander(world: World, cmd: Commander) {
  const now = world.now();
  const state =
    cmd.woundedUntil && cmd.woundedUntil > now
      ? "wounded"
      : cmd.busyMarchId
        ? "busy"
        : "available";
  return {
    id: cmd.id,
    name: cmd.name,
    stars: cmd.stars,
    leadership: cmd.leadership,
    attack: cmd.attack,
    defense: cmd.defense,
    life: cmd.life,
    xp: cmd.xp,
    state,
    woundedUntil: cmd.woundedUntil
      ? new Date(cmd.woundedUntil).toISOString()
      : null,
    busyMarchId: cmd.busyMarchId,
  };
}

export function createApp(world: World) {
  const app = new Hono<AppEnv>();

  app.use(
    "*",
    cors({
      origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
      ],
      credentials: true,
    }),
  );

  app.use("*", async (c, next) => {
    c.set("world", world);
    // Tick sim lightly on each request (also interval in index)
    world.tick();
    const token =
      getCookie(c, "dragonwake_session") ??
      c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");
    c.set("player", world.sessionPlayer(token ?? null));
    await next();
    // Delta persist after mutations; serialized + debounced by the World's
    // persist chain (full dumps only happen at boot).
    if (world.store) {
      void world.flush();
    }
  });

  app.get("/health", (c) => {
    const body: HealthResponse = {
      ok: true,
      service: "dragonwake-server",
      version: VERSION,
      time: new Date().toISOString(),
      // Reflect live attach mode, not mere env presence
      db: world.dbMode,
    };
    return c.json(body);
  });

  app.get("/", (c) =>
    c.json({
      name: "Dragon Wake API",
      version: VERSION,
      slice: "A1-A10 MVP beta",
      health: "/health",
      api: "/api/v1",
    }),
  );

  const api = new Hono<AppEnv>();

  api.get("/content/meta", (c) =>
    c.json({
      meta: getMeta(),
      combatRulesVersion: COMBAT_RULES_VERSION,
      unitCount: getUnits().length,
    }),
  );

  api.get("/content/units", (c) => c.json({ units: getUnits() }));
  api.get("/content/formulas", (c) =>
    c.json({ formulas: getFormulas(), buildings: getBuildings(), research: getResearch() }),
  );
  api.get("/content/buildings", (c) => c.json({ buildings: getBuildings() }));
  api.get("/content/research", (c) => c.json({ research: getResearch() }));
  api.get("/content/research-unlocks", (c) =>
    c.json({ unlocks: getResearchUnlocks() }),
  );
  api.get("/content/bestiary", (c) =>
    c.json({ entries: getBestiaryEntries() }),
  );

  api.post("/auth/guest", async (c) => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
      c.req.header("x-real-ip") ||
      "local";
    if (!rateLimit(`guest:${ip}`, LIMITS.guest.max, LIMITS.guest.windowMs)) {
      return err(c, "RATE_LIMIT", "too many guest creates", 429);
    }
    const raw = await c.req.json().catch(() => ({}));
    const parsed = parseBody(guestBodySchema, raw);
    if (!parsed.ok) {
      return err(c, parsed.code, parsed.message);
    }
    const faction = (parsed.data.faction ?? "northern_kingdom") as Faction;
    if (!FACTIONS.includes(faction)) {
      return err(c, "BAD_FACTION", "invalid faction");
    }
    try {
      const { player, city, token } = world.createGuest(
        parsed.data.displayName ?? `Guest${world.players.size + 1}`,
        faction,
      );
      setCookie(c, "dragonwake_session", token, {
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
        maxAge: 7 * 24 * 3600,
      });
      return c.json({
        player: publicPlayer(player),
        city: publicCity(city, world),
        token,
        serverNow: Date.now(),
      });
    } catch (e) {
      const code = (e as { code?: string }).code ?? "AUTH_FAIL";
      return err(c, code, e instanceof Error ? e.message : String(e));
    }
  });

  api.post("/auth/logout", (c) => {
    deleteCookie(c, "dragonwake_session", { path: "/" });
    return c.body(null, 204);
  });

  /** Polling events (P0.2) — prefer this from browser; SSE also available. */
  api.get("/events", (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const since = Number(c.req.query("since") ?? 0);
    const events = world.eventsSince(player.id, Number.isFinite(since) ? since : 0);
    return c.json({
      events,
      serverNow: world.now(),
      latestSeq: events.length
        ? events[events.length - 1]!.seq
        : since,
    });
  });

  /** SSE stream of the same events (cookie session works with credentials). */
  api.get("/events/stream", (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    let lastSeq = Number(c.req.query("since") ?? 0);
    if (!Number.isFinite(lastSeq)) lastSeq = 0;
    const playerId = player.id;
    const stream = new ReadableStream({
      start(controller) {
        const enc = new TextEncoder();
        const send = (payload: unknown) => {
          controller.enqueue(enc.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };
        send({ type: "hello", serverNow: world.now(), since: lastSeq });
        const iv = setInterval(() => {
          try {
            world.tick();
            const batch = world.eventsSince(playerId, lastSeq);
            for (const e of batch) {
              lastSeq = e.seq;
              send(e);
            }
          } catch {
            // keep stream alive
          }
        }, 1000);
        const close = () => {
          clearInterval(iv);
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        };
        c.req.raw.signal.addEventListener("abort", close);
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  });

  api.get("/me", (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const cities = world.citiesForPlayer(player.id).map((c) =>
      publicCity(c, world),
    );
    const mem = world.allianceMembers.get(player.id);
    const alliance = mem ? world.alliances.get(mem.allianceId) : null;
    return c.json({
      player: publicPlayer(player),
      cities,
      alliance: alliance
        ? { id: alliance.id, name: alliance.name, tag: alliance.tag }
        : null,
      tutorial: world.tutorialView(player.id),
      dailyQuests: world.listDailyQuests(player.id),
      serverNow: Date.now(),
      devMode: devModeEnabled(),
    });
  });

  api.get("/cities/:id", (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const city = world.getCity(c.req.param("id"));
    if (!city || city.playerId !== player.id) {
      return err(c, "NO_CITY", "not found", 404);
    }
    return c.json({ city: publicCity(city, world) });
  });

  api.get("/cities/:id/queues", (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const cityId = c.req.param("id");
    const jobs = [...world.jobs.values()].filter(
      (j) => j.cityId === cityId && j.playerId === player.id,
    );
    return c.json({ jobs });
  });

  api.post("/cities/:id/buildings", async (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const parsed = parseBody(buildBodySchema, await c.req.json().catch(() => ({})));
    if (!parsed.ok) return err(c, parsed.code, parsed.message);
    try {
      const job = world.startBuild(
        c.req.param("id"),
        player.id,
        parsed.data.slotIndex,
        parsed.data.buildingType,
      );
      return c.json({ job });
    } catch (e) {
      return err(
        c,
        (e as { code?: string }).code ?? "BUILD_FAIL",
        e instanceof Error ? e.message : String(e),
      );
    }
  });

  api.post("/cities/:id/research", async (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const parsed = parseBody(researchBodySchema, await c.req.json().catch(() => ({})));
    if (!parsed.ok) return err(c, parsed.code, parsed.message);
    try {
      const job = world.startResearch(
        c.req.param("id"),
        player.id,
        parsed.data.techId,
      );
      return c.json({ job });
    } catch (e) {
      return err(
        c,
        (e as { code?: string }).code ?? "RESEARCH_FAIL",
        e instanceof Error ? e.message : String(e),
      );
    }
  });

  api.post("/cities/:id/train", async (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const parsed = parseBody(trainBodySchema, await c.req.json().catch(() => ({})));
    if (!parsed.ok) return err(c, parsed.code, parsed.message);
    try {
      const job = world.startTrain(
        c.req.param("id"),
        player.id,
        parsed.data.unitId,
        parsed.data.count,
      );
      return c.json({ job });
    } catch (e) {
      return err(
        c,
        (e as { code?: string }).code ?? "TRAIN_FAIL",
        e instanceof Error ? e.message : String(e),
      );
    }
  });

  api.post("/cities/:id/posture", async (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const parsed = parseBody(postureBodySchema, await c.req.json().catch(() => ({})));
    if (!parsed.ok) return err(c, parsed.code, parsed.message);
    try {
      const city = world.setPosture(
        c.req.param("id"),
        player.id,
        parsed.data.posture,
      );
      return c.json({ city: publicCity(city, world) });
    } catch (e) {
      return err(c, "POSTURE_FAIL", e instanceof Error ? e.message : String(e));
    }
  });

  api.get("/content/plot-types", (c) =>
    c.json({
      plotTypes: PLOT_TYPES.map((id) => ({
        id,
        name: id
          .split("_")
          .map((w) => w[0]!.toUpperCase() + w.slice(1))
          .join(" "),
      })),
      assignCost: { food: 80, wood: 40 },
      upgradeCostPerLevel: { food: 50, wood: 50 },
      maxLevel: 5,
    }),
  );

  api.post("/cities/:id/plots", async (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const body = (await c.req.json()) as {
      slotIndex: number;
      plotType: string;
    };
    try {
      const plot = world.assignPlot(
        c.req.param("id"),
        player.id,
        Number(body.slotIndex),
        String(body.plotType),
      );
      return c.json({ plot });
    } catch (e) {
      return err(
        c,
        (e as { code?: string }).code ?? "PLOT_FAIL",
        e instanceof Error ? e.message : String(e),
      );
    }
  });

  api.post("/cities/:id/plots/upgrade", async (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const body = (await c.req.json()) as { slotIndex: number };
    try {
      const plot = world.upgradePlot(
        c.req.param("id"),
        player.id,
        Number(body.slotIndex),
      );
      return c.json({ plot });
    } catch (e) {
      return err(
        c,
        (e as { code?: string }).code ?? "PLOT_UPGRADE_FAIL",
        e instanceof Error ? e.message : String(e),
      );
    }
  });

  api.get("/map/viewport", (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const x0 = Number(c.req.query("x0") ?? 0);
    const y0 = Number(c.req.query("y0") ?? 0);
    const x1 = Number(c.req.query("x1") ?? 39);
    const y1 = Number(c.req.query("y1") ?? 39);
    return c.json(world.mapViewport(x0, y0, x1, y1));
  });

  api.get("/map/tile", (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const x = Number(c.req.query("x"));
    const y = Number(c.req.query("y"));
    const city = [...world.cities.values()].find(
      (ct) => ct.mapX === x && ct.mapY === y,
    );
    const camp = [...world.camps.values()].find((cp) => cp.x === x && cp.y === y);
    const wild = [...world.wilderness.values()].find(
      (w) => w.x === x && w.y === y,
    );
    return c.json({ x, y, city, camp, wilderness: wild });
  });

  api.get("/marches", (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const marches = [...world.marches.values()].filter(
      (m) => m.playerId === player.id,
    );
    return c.json({ marches });
  });

  api.post("/marches", async (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    if (!rateLimit(`march:${player.id}`, LIMITS.march.max, LIMITS.march.windowMs)) {
      return err(c, "RATE_LIMIT", "too many marches", 429);
    }
    const parsed = parseBody(marchBodySchema, await c.req.json().catch(() => ({})));
    if (!parsed.ok) return err(c, parsed.code, parsed.message);
    const body = parsed.data;
    try {
      const march = world.createMarch(player.id, {
        fromCityId: body.fromCityId,
        intent: body.intent,
        targetType: body.target.type,
        targetId: body.target.id ?? null,
        targetX: body.target.x,
        targetY: body.target.y,
        composition: body.composition ?? {},
        cargo: body.cargo,
        commanderId: body.commanderId ?? null,
      });
      return c.json({ march });
    } catch (e) {
      return err(
        c,
        (e as { code?: string }).code ?? "MARCH_FAIL",
        e instanceof Error ? e.message : String(e),
      );
    }
  });

  api.get("/reports", (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const reports = [...world.reports.values()]
      .filter(
        (r) =>
          r.attackerPlayerId === player.id ||
          r.defenderPlayerId === player.id,
      )
      .sort((a, b) => b.createdAt - a.createdAt);
    return c.json({ reports });
  });

  api.get("/reports/:id", (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const report = world.reports.get(c.req.param("id"));
    // Ownership check — 404 (not 403) so existence isn't leaked.
    if (
      !report ||
      (report.attackerPlayerId !== player.id &&
        report.defenderPlayerId !== player.id)
    ) {
      return err(c, "NO_REPORT", "not found", 404);
    }
    return c.json({ report });
  });

  api.get("/commanders", (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const commanders = world
      .commandersForPlayer(player.id)
      .map((cmd) => publicCommander(world, cmd));
    return c.json({ commanders });
  });

  api.post("/commanders/recruit", async (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    await c.req.json().catch(() => ({}));
    try {
      const commander = world.recruitCommander(player.id);
      return c.json({ commander: publicCommander(world, commander) });
    } catch (e) {
      return err(
        c,
        (e as { code?: string }).code ?? "RECRUIT_FAIL",
        e instanceof Error ? e.message : String(e),
      );
    }
  });

  api.get("/citadels", (c) => c.json({ citadels: getCitadels() }));

  api.post("/settlements/found-marcher-keep", async (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const body = (await c.req.json().catch(() => ({}))) as { name?: string };
    try {
      const city = world.foundMarcherKeep(player.id, body.name);
      return c.json({ city: publicCity(city, world) });
    } catch (e) {
      return err(
        c,
        (e as { code?: string }).code ?? "MARCHER_FAIL",
        e instanceof Error ? e.message : String(e),
      );
    }
  });

  api.post("/citadels/found-brinehold", async (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const body = (await c.req.json().catch(() => ({}))) as { name?: string };
    // Dev unlock path — same gates as the generic found route. This route
    // previously granted brinehold_unlock to ANY player unconditionally.
    if (!adminAuthorized(c) || process.env.DEV_CITADEL_UNLOCK === "0") {
      return err(
        c,
        "DEV_DISABLED",
        "dev citadel unlock disabled (requires admin or non-production with DEV_CITADEL_UNLOCK)",
      );
    }
    try {
      world.adminGrant(player.id, { brineholdUnlock: true });
      const city = world.foundBrinehold(player.id, body.name);
      return c.json({ city: publicCity(city, world) });
    } catch (e) {
      return err(
        c,
        (e as { code?: string }).code ?? "BRINE_FAIL",
        e instanceof Error ? e.message : String(e),
      );
    }
  });

  /** S1+ generic found: { kind: "stonekeel", name?, unlock?: true } */
  api.post("/citadels/found", async (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const body = (await c.req.json().catch(() => ({}))) as {
      kind?: string;
      name?: string;
      unlock?: boolean;
    };
    const kind = body.kind ?? "";
    if (!kind) return err(c, "VALIDATION", "kind required");
    // Dev unlock path is a beta affordance; requires dev mode or admin token,
    // and operators can disable it entirely with DEV_CITADEL_UNLOCK=0.
    const devUnlockEnabled =
      process.env.DEV_CITADEL_UNLOCK !== "0" && adminAuthorized(c);
    if (body.unlock !== false && !devUnlockEnabled) {
      return err(
        c,
        "DEV_DISABLED",
        "dev citadel unlock disabled (requires admin token in production, or DEV_CITADEL_UNLOCK)",
      );
    }
    try {
      if (body.unlock !== false) {
        // Dev/demo unlock: walk the ladder's prerequisites so `kind` is
        // reachable in one call (found chain brinehold → stonekeel →
        // cinderreach → galeari).
        const prereqs: string[] = [];
        let cur = getCitadelById(kind);
        while (cur && cur.requires && cur.requires.length > 0) {
          const pid = cur.requires[0]!;
          prereqs.unshift(pid);
          cur = getCitadelById(pid);
        }
        for (const id of prereqs) {
          const def = getCitadelById(id);
          if (!def) continue;
          world.adminGrant(player.id, {
            brineholdUnlock: id === "brinehold",
            stonekeelUnlock: id === "stonekeel",
            citadelUnlock: id,
          });
          if (!world.citiesForPlayer(player.id).some((x) => x.kind === id)) {
            world.foundCitadel(player.id, id);
          }
        }
        world.adminGrant(player.id, {
          brineholdUnlock: kind === "brinehold",
          stonekeelUnlock: kind === "stonekeel",
          citadelUnlock: kind,
        });
      }
      const city = world.foundCitadel(player.id, kind, body.name);
      return c.json({ city: publicCity(city, world) });
    } catch (e) {
      return err(
        c,
        (e as { code?: string }).code ?? "CITADEL_FAIL",
        e instanceof Error ? e.message : String(e),
      );
    }
  });

  api.get("/alliances", (c) => {
    return c.json({ alliances: world.listAlliances() });
  });

  api.post("/alliances", async (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const parsed = parseBody(allianceCreateSchema, await c.req.json().catch(() => ({})));
    if (!parsed.ok) return err(c, parsed.code, parsed.message);
    try {
      const alliance = world.createAlliance(
        player.id,
        parsed.data.name,
        parsed.data.tag,
      );
      return c.json({ alliance });
    } catch (e) {
      return err(
        c,
        (e as { code?: string }).code ?? "ALLY_FAIL",
        e instanceof Error ? e.message : String(e),
      );
    }
  });

  api.post("/alliances/join", async (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const parsed = parseBody(allianceJoinSchema, await c.req.json().catch(() => ({})));
    if (!parsed.ok) return err(c, parsed.code, parsed.message);
    const body = parsed.data;
    try {
      if (body.tag) {
        const alliance = world.joinAllianceByTag(player.id, body.tag);
        return c.json({ ok: true, alliance });
      }
      if (body.allianceId) {
        world.joinAlliance(player.id, body.allianceId);
        const alliance = world.alliances.get(body.allianceId);
        return c.json({ ok: true, alliance });
      }
      return err(c, "BAD_JOIN", "allianceId or tag required");
    } catch (e) {
      return err(
        c,
        (e as { code?: string }).code ?? "JOIN_FAIL",
        e instanceof Error ? e.message : String(e),
      );
    }
  });

  api.post("/alliances/:id/join", (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    try {
      world.joinAlliance(player.id, c.req.param("id"));
      return c.json({ ok: true });
    } catch (e) {
      return err(
        c,
        (e as { code?: string }).code ?? "JOIN_FAIL",
        e instanceof Error ? e.message : String(e),
      );
    }
  });

  api.get("/alliances/:id", (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const alliance = world.alliances.get(c.req.param("id"));
    if (!alliance) return err(c, "NO_ALLY", "not found", 404);
    const members = [...world.allianceMembers.values()]
      .filter((m) => m.allianceId === alliance.id)
      .map((m) => {
        const p = world.players.get(m.playerId);
        return {
          playerId: m.playerId,
          rank: m.rank,
          displayName: p?.displayName,
        };
      });
    return c.json({ alliance, members });
  });

  api.post("/alliances/:id/chat", async (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    if (!rateLimit(`chat:${player.id}`, LIMITS.chat.max, LIMITS.chat.windowMs)) {
      return err(c, "RATE_LIMIT", "too many chat messages", 429);
    }
    const parsed = parseBody(chatBodySchema, await c.req.json().catch(() => ({})));
    if (!parsed.ok) return err(c, parsed.code, parsed.message);
    try {
      const msg = world.postChat(
        player.id,
        c.req.param("id"),
        parsed.data.body,
      );
      return c.json({ message: msg });
    } catch (e) {
      return err(
        c,
        (e as { code?: string }).code ?? "CHAT_FAIL",
        e instanceof Error ? e.message : String(e),
      );
    }
  });

  api.get("/alliances/:id/chat", (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const allianceId = c.req.param("id");
    // Members only — chat history was previously readable by anyone.
    const mem = world.allianceMembers.get(player.id);
    if (!mem || mem.allianceId !== allianceId) {
      return err(c, "FORBIDDEN", "not an alliance member", 403);
    }
    const since = Number(c.req.query("since") ?? 0);
    const messages = world.chat
      .filter(
        (m) => m.allianceId === allianceId && m.createdAt >= since,
      )
      .map((m) => ({
        ...m,
        fromPlayerName:
          world.players.get(m.fromPlayerId)?.displayName ?? "Messenger",
      }));
    return c.json({ messages });
  });

  api.get("/shop/catalog", (c) => c.json({ catalog: getShop() }));

  api.post("/shop/buy", async (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const body = (await c.req.json()) as { itemId: string };
    try {
      const result = world.shopBuy(player.id, body.itemId);
      return c.json(result);
    } catch (e) {
      return err(
        c,
        (e as { code?: string }).code ?? "SHOP_FAIL",
        e instanceof Error ? e.message : String(e),
      );
    }
  });

  api.get("/inventory", (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    return c.json({ items: world.inventory.get(player.id) ?? {} });
  });

  api.post("/admin/grant", async (c) => {
    if (!adminAuthorized(c)) {
      return err(c, "FORBIDDEN", "admin disabled", 403);
    }
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    if (!rateLimit(`admin:${player.id}`, LIMITS.admin.max, LIMITS.admin.windowMs)) {
      return err(c, "RATE_LIMIT", "too many admin grants", 429);
    }
    const parsed = parseBody(adminGrantSchema, await c.req.json().catch(() => ({})));
    if (!parsed.ok) return err(c, parsed.code, parsed.message);
    world.adminGrant(player.id, parsed.data);
    return c.json({ ok: true, me: publicPlayer(world.players.get(player.id)!) });
  });

  api.get("/tutorial", (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    return c.json({
      tutorial: world.tutorialView(player.id),
      steps: TUTORIAL_STEPS,
    });
  });

  api.post("/tutorial/advance", async (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const t = world.advanceTutorial(player.id);
    return c.json({ tutorial: world.tutorialView(player.id), raw: t });
  });

  api.get("/quests/daily", (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    return c.json({ quests: world.listDailyQuests(player.id) });
  });

  api.post("/quests/daily/:id/claim", (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    try {
      const result = world.claimDailyQuest(player.id, c.req.param("id"));
      return c.json({
        ...result,
        quests: world.listDailyQuests(player.id),
        player: publicPlayer(world.players.get(player.id)!),
      });
    } catch (e) {
      return err(
        c,
        (e as { code?: string }).code ?? "QUEST_FAIL",
        e instanceof Error ? e.message : String(e),
      );
    }
  });

  api.post("/sim/tick", (c) => {
    // Dev helper to force sim — authenticated admins/dev only.
    const player = c.get("player");
    if (!player || !adminAuthorized(c)) {
      return err(c, "FORBIDDEN", "sim tick requires an admin session", 403);
    }
    world.tick();
    return c.json({ ok: true, time: new Date().toISOString() });
  });

  api.get("/dragon/readiness", (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const status = world.checkDragonReadiness(player.id);
    return c.json(status);
  });

  api.get("/dragon/objectives", (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    return c.json({ objectives: world.dragonObjectives(player.id) });
  });

  api.get("/dragon/bestiary", (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const entries = [...world.bestiary.entries()]
      .filter(([key]) => key.startsWith(`${player.id}:`))
      .map(([, value]) => value);
    return c.json({ entries });
  });

  api.get("/dragon/expedition", (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const progress = world.dragonProgress.get(player.id);
    const expeditions = getExpeditions();
    const expedition = expeditions[0];
    return c.json({
      expeditionId: expedition?.id ?? null,
      name: expedition?.name ?? null,
      stages: expedition?.stages ?? [],
      currentStage: progress?.expeditionStage ?? 0,
      charterEarned: progress?.charterEarned ?? false,
      progress: {
        campsDefeated: progress?.campsDefeated ?? 0,
        scoutsSent: progress?.scoutsSent ?? 0,
      },
    });
  });

  // Expedition start/complete-stage endpoints
  api.post("/dragon/expedition/start", async (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const body = (await c.req.json().catch(() => ({}))) as { expeditionId?: string };
    const expeditionId = body.expeditionId ?? "first_dragon_expedition";
    let result: ReturnType<World["startExpedition"]>;
    try {
      result = world.startExpedition(player.id, expeditionId);
    } catch (e) {
      return err(
        c,
        (e as { code?: string }).code ?? "EXPEDITION_FAIL",
        e instanceof Error ? e.message : String(e),
      );
    }
    if (!result) return err(c, "EXPEDITION_FAIL", "cannot start expedition — check readiness");
    return c.json(result);
  });

  api.post("/dragon/expedition/complete-stage", async (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const body = (await c.req.json().catch(() => ({}))) as { expeditionId?: string; stageNumber?: number };
    const expeditionId = body.expeditionId ?? "first_dragon_expedition";
    const stageNumber = Number(body.stageNumber);
    if (!stageNumber || stageNumber < 1) return err(c, "VALIDATION", "stageNumber required");
    let result: ReturnType<World["completeExpeditionStage"]>;
    try {
      result = world.completeExpeditionStage(player.id, expeditionId, stageNumber);
    } catch (e) {
      return err(
        c,
        (e as { code?: string }).code ?? "EXPEDITION_FAIL",
        e instanceof Error ? e.message : String(e),
      );
    }
    if (!result) return err(c, "EXPEDITION_FAIL", "cannot complete stage");
    return c.json(result);
  });

  api.get("/dragon/clues", (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const inv = world.inventory.get(player.id) ?? {};
    const clues = getDragonClues();
    const collected = clues
      .filter((clue) => (inv[clue.id] ?? 0) > 0 || (inv["dragon_clue"] ?? 0) > 0)
      .map((clue) => ({
        id: clue.id,
        name: clue.name,
        description: clue.description,
        rarity: clue.rarity,
        count: inv[clue.id] ?? 0,
      }));
    const dragonMaterials = inv["dragon_material"] ?? 0;
    return c.json({
      clues: collected,
      dragonMaterials,
      dailyClueCap: world.dailyClueUsage(player.id),
    });
  });

  app.route("/api/v1", api);
  return app;
}
