import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import {
  COMBAT_RULES_VERSION,
} from "@tideforge/combat";
import {
  getBuildings,
  getFormulas,
  getMeta,
  getResearch,
  getShop,
  getUnits,
} from "@tideforge/content";
import type { Faction, HealthResponse } from "@tideforge/shared";
import { FACTIONS } from "@tideforge/shared";
import {
  World,
  type City,
  type Player,
  PLOT_TYPES,
} from "./world.js";

export const VERSION = "0.2.1-mvp-polish";

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
  };
}

function err(c: { json: (b: unknown, s: number) => Response }, code: string, message: string, status = 400) {
  return c.json({ error: { code, message } }, status);
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
      getCookie(c, "tideforge_session") ??
      c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");
    c.set("player", world.sessionPlayer(token ?? null));
    await next();
    // Write-through after every request so PG survives restarts
    if (world.store) {
      await world.flush();
    }
  });

  app.get("/health", (c) => {
    const body: HealthResponse = {
      ok: true,
      service: "tideforge-server",
      version: VERSION,
      time: new Date().toISOString(),
      // Reflect live attach mode, not mere env presence
      db: world.dbMode,
    };
    return c.json(body);
  });

  app.get("/", (c) =>
    c.json({
      name: "Tideforge Empires API",
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

  api.post("/auth/guest", async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as {
      displayName?: string;
      faction?: string;
    };
    const faction = (body.faction ?? "brinecant") as Faction;
    if (!FACTIONS.includes(faction)) {
      return err(c, "BAD_FACTION", "invalid faction");
    }
    try {
      const { player, city, token } = world.createGuest(
        body.displayName ?? `Guest${world.players.size + 1}`,
        faction,
      );
      setCookie(c, "tideforge_session", token, {
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
    deleteCookie(c, "tideforge_session", { path: "/" });
    return c.body(null, 204);
  });

  api.get("/me", (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const cities = world.citiesForPlayer(player.id).map((c) =>
      publicCity(c, world),
    );
    const mem = world.allianceMembers.get(player.id);
    const alliance = mem ? world.alliances.get(mem.allianceId) : null;
    const tutorial = world.tutorials.get(player.id);
    return c.json({
      player: publicPlayer(player),
      cities,
      alliance: alliance
        ? { id: alliance.id, name: alliance.name, tag: alliance.tag }
        : null,
      tutorial,
      serverNow: Date.now(),
      sovereigns: [...world.sovereigns.values()]
        .filter((s) => s.playerId === player.id)
        .map((s) => ({
          id: s.id,
          sovereignType: s.sovereignType,
          level: s.level,
          harnessComplete: world.harnessComplete(s),
          harness: {
            crown: s.harnessCrown,
            heart: s.harnessHeart,
            grasp: s.harnessGrasp,
            keel: s.harnessKeel,
          },
        })),
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
    const body = (await c.req.json()) as {
      slotIndex: number;
      buildingType: string;
    };
    try {
      const job = world.startBuild(
        c.req.param("id"),
        player.id,
        Number(body.slotIndex),
        String(body.buildingType),
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
    const body = (await c.req.json()) as { techId: string };
    try {
      const job = world.startResearch(
        c.req.param("id"),
        player.id,
        String(body.techId),
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
    const body = (await c.req.json()) as { unitId: string; count: number };
    try {
      const job = world.startTrain(
        c.req.param("id"),
        player.id,
        String(body.unitId),
        Number(body.count),
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
    const body = (await c.req.json()) as { posture: "harbor" | "partial" | "full" };
    try {
      const city = world.setPosture(
        c.req.param("id"),
        player.id,
        body.posture,
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
      assignCost: { kelp: 80, driftwood: 40 },
      upgradeCostPerLevel: { kelp: 50, driftwood: 50 },
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
    const x0 = Number(c.req.query("x0") ?? 0);
    const y0 = Number(c.req.query("y0") ?? 0);
    const x1 = Number(c.req.query("x1") ?? 39);
    const y1 = Number(c.req.query("y1") ?? 39);
    return c.json(world.mapViewport(x0, y0, x1, y1));
  });

  api.get("/map/tile", (c) => {
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
    const body = (await c.req.json()) as {
      fromCityId: string;
      intent: "scout" | "attack" | "occupy" | "reinforce" | "haul";
      target: {
        type: "camp" | "wilderness" | "city" | "coords";
        id?: string;
        x: number;
        y: number;
      };
      composition: Record<string, number>;
      sovereignId?: string;
    };
    try {
      const march = world.createMarch(player.id, {
        fromCityId: body.fromCityId,
        intent: body.intent,
        targetType: body.target.type,
        targetId: body.target.id ?? null,
        targetX: body.target.x,
        targetY: body.target.y,
        composition: body.composition ?? {},
        sovereignId: body.sovereignId ?? null,
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
    if (!report) return err(c, "NO_REPORT", "not found", 404);
    return c.json({ report });
  });

  api.get("/sovereigns", (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const list = [...world.sovereigns.values()]
      .filter((s) => s.playerId === player.id)
      .map((s) => ({
        ...s,
        harnessComplete: world.harnessComplete(s),
      }));
    return c.json({ sovereigns: list });
  });

  api.post("/citadels/found-brinehold", async (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const body = (await c.req.json().catch(() => ({}))) as { name?: string };
    try {
      // Dev unlock path
      world.adminGrant(player.id, { brineholdUnlock: true });
      const city = world.foundBrinehold(player.id, body.name);
      return c.json({ city: publicCity(city, world) });
    } catch (e) {
      return err(c, "BRINE_FAIL", e instanceof Error ? e.message : String(e));
    }
  });

  api.post("/alliances", async (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const body = (await c.req.json()) as { name: string; tag: string };
    try {
      const alliance = world.createAlliance(
        player.id,
        body.name,
        body.tag,
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
    const body = (await c.req.json()) as { body: string };
    try {
      const msg = world.postChat(
        player.id,
        c.req.param("id"),
        body.body ?? "",
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
    const allianceId = c.req.param("id");
    const since = Number(c.req.query("since") ?? 0);
    const messages = world.chat.filter(
      (m) => m.allianceId === allianceId && m.createdAt >= since,
    );
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
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_ADMIN !== "1") {
      return err(c, "FORBIDDEN", "admin disabled", 403);
    }
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const body = await c.req.json();
    world.adminGrant(player.id, body);
    return c.json({ ok: true, me: publicPlayer(world.players.get(player.id)!) });
  });

  api.post("/tutorial/advance", async (c) => {
    const player = c.get("player");
    if (!player) return err(c, "UNAUTHORIZED", "login required", 401);
    const t = world.tutorials.get(player.id) ?? {
      playerId: player.id,
      step: 0,
      completed: false,
    };
    t.step = Math.min(10, t.step + 1);
    if (t.step >= 10) t.completed = true;
    world.tutorials.set(player.id, t);
    return c.json({ tutorial: t });
  });

  api.post("/sim/tick", (c) => {
    // Dev helper to force sim
    world.tick();
    return c.json({ ok: true, time: new Date().toISOString() });
  });

  app.route("/api/v1", api);
  return app;
}
