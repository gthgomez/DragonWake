import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";
import { World } from "./world.js";

async function json(
  app: ReturnType<typeof createApp>,
  path: string,
  init?: RequestInit & { token?: string },
) {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json");
  if (init?.token) headers.set("Authorization", `Bearer ${init.token}`);
  const res = await app.request(path, { ...init, headers });
  const body = res.status === 204 ? null : await res.json();
  return { res, body };
}

describe("HTTP API two-session demo path", () => {
  it("guest A/B, camp attack, occupy, alliance, pvp, brinehold, shop", async () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const app = createApp(world);

    const health = await json(app, "/health");
    expect(health.body.ok).toBe(true);

    const a = await json(app, "/api/v1/auth/guest", {
      method: "POST",
      body: JSON.stringify({ displayName: "ApiA", faction: "northern_kingdom" }),
    });
    expect(a.res.status).toBe(200);
    expect(a.body.city.resources.food).toBeGreaterThan(0);
    const tokenA = a.body.token as string;
    const cityA = a.body.city.id as string;

    const b = await json(app, "/api/v1/auth/guest", {
      method: "POST",
      body: JSON.stringify({ displayName: "ApiB", faction: "mountain_realm" }),
    });
    expect(b.res.status).toBe(200);
    const tokenB = b.body.token as string;
    expect(
      a.body.city.mapX !== b.body.city.mapX ||
        a.body.city.mapY !== b.body.city.mapY,
    ).toBe(true);

    // Grant troops
    await json(app, "/api/v1/admin/grant", {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({
        units: { bowman: 300, levy: 200 },
        brineholdUnlock: true,
        skipProtection: true,
        dracolith: 100,
      }),
    });
    await json(app, "/api/v1/admin/grant", {
      method: "POST",
      token: tokenB,
      body: JSON.stringify({ skipProtection: true }),
    });

    // Build
    const build = await json(app, `/api/v1/cities/${cityA}/buildings`, {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({ slotIndex: 2, buildingType: "barracks" }),
    });
    expect(build.body.job.kind).toBe("build");
    build.body.job.finishesAt = 0;
    world.jobs.get(build.body.job.id)!.finishesAt = 0;
    world.tick();

    // Map viewport
    const map = await json(app, "/api/v1/map/viewport?x0=0&y0=0&x1=39&y1=39", {
      token: tokenA,
    });
    expect(map.body.camps.length).toBeGreaterThan(0);
    expect(map.body.wilderness.length).toBeGreaterThan(0);
    const camp = map.body.camps.find((c: { level: number }) => c.level === 1);

    // Camp attack
    const march = await json(app, "/api/v1/marches", {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({
        fromCityId: cityA,
        intent: "attack",
        target: { type: "camp", id: camp.id, x: camp.x, y: camp.y },
        composition: { bowman: 100, levy: 50 },
      }),
    });
    expect(march.body.march.id).toBeTruthy();
    const m = world.marches.get(march.body.march.id)!;
    m.arriveAt = 0;
    world.tick();
    expect(m.landCount).toBe(1);
    expect(m.battleReportId).toBeTruthy();

    const reports = await json(app, "/api/v1/reports", { token: tokenA });
    expect(reports.body.reports.length).toBeGreaterThan(0);

    // Occupy wild
    const wild = map.body.wilderness[0];
    const occ = await json(app, "/api/v1/marches", {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({
        fromCityId: cityA,
        intent: "occupy",
        target: { type: "wilderness", id: wild.id, x: wild.x, y: wild.y },
        composition: { levy: 80 },
      }),
    });
    const om = world.marches.get(occ.body.march.id)!;
    om.arriveAt = 0;
    world.tick();

    // Brinehold
    const brine = await json(app, "/api/v1/citadels/found-brinehold", {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({ name: "Api Brine" }),
    });
    expect(brine.body.city.kind).toBe("brinehold");

    // Tideband
    const ally = await json(app, "/api/v1/alliances", {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({ name: "Api Band", tag: "API" }),
    });
    await json(app, `/api/v1/alliances/${ally.body.alliance.id}/join`, {
      method: "POST",
      token: tokenB,
    });
    const chat = await json(
      app,
      `/api/v1/alliances/${ally.body.alliance.id}/chat`,
      {
        method: "POST",
        token: tokenA,
        body: JSON.stringify({ body: "Hello from A" }),
      },
    );
    expect(chat.body.message.body).toBe("Hello from A");
    const chatList = await json(
      app,
      `/api/v1/alliances/${ally.body.alliance.id}/chat`,
      { token: tokenB },
    );
    expect(
      chatList.body.messages.some(
        (m: { body: string }) => m.body === "Hello from A",
      ),
    ).toBe(true);

    // PvP withdraw
    await json(app, `/api/v1/cities/${b.body.city.id}/posture`, {
      method: "POST",
      token: tokenB,
      body: JSON.stringify({ posture: "withdraw" }),
    });
    const pvp = await json(app, "/api/v1/marches", {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({
        fromCityId: cityA,
        intent: "attack",
        target: {
          type: "city",
          id: b.body.city.id,
          x: b.body.city.mapX,
          y: b.body.city.mapY,
        },
        composition: { levy: 20 },
      }),
    });
    const pm = world.marches.get(pvp.body.march.id)!;
    pm.arriveAt = 0;
    world.tick();
    expect(pm.battleReportId).toBeTruthy();

    // Shop with Dracoliths
    const buy = await json(app, "/api/v1/shop/buy", {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({ itemId: "speedup_1h" }),
    });
    expect(buy.body.itemId).toBe("speedup_1h");

    // Codex formulas
    const formulas = await json(app, "/api/v1/content/formulas");
    expect(formulas.body.formulas.rulesVersion).toBeTruthy();

    // Sovereign removed in M4 — /me carries no sovereign payload
    const me = await json(app, "/api/v1/me", { token: tokenA });
    expect(me.body.sovereigns).toBeUndefined();
  });
});

describe("HTTP API reinforcement controls", () => {
  it("allows only the sender to recall a stationed allied march", async () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const app = createApp(world);
    const a = await json(app, "/api/v1/auth/guest", {
      method: "POST",
      body: JSON.stringify({ displayName: "RecallApiA", faction: "northern_kingdom" }),
    });
    const b = await json(app, "/api/v1/auth/guest", {
      method: "POST",
      body: JSON.stringify({ displayName: "RecallApiB", faction: "mountain_realm" }),
    });
    const tokenA = a.body.token as string;
    const tokenB = b.body.token as string;
    const alliance = await json(app, "/api/v1/alliances", {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({ name: "Recall Line", tag: "RCL" }),
    });
    const allianceId = alliance.body.alliance.id as string;
    await json(app, `/api/v1/alliances/${allianceId}/join`, {
      method: "POST",
      token: tokenB,
    });
    await json(app, "/api/v1/admin/grant", {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({ units: { levy: 10 } }),
    });
    const sent = await json(app, "/api/v1/marches", {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({
        fromCityId: a.body.city.id,
        intent: "reinforce",
        target: { type: "city", id: b.body.city.id, x: b.body.city.mapX, y: b.body.city.mapY },
        composition: { levy: 10 },
      }),
    });
    const march = world.marches.get(sent.body.march.id)!;
    march.arriveAt = 0;
    world.tick();
    expect(march.status).toBe("stationed");
    const forbidden = await json(app, `/api/v1/marches/${march.id}/recall`, {
      method: "POST",
      token: tokenB,
    });
    expect(forbidden.res.status).toBe(400);
    expect(forbidden.body.error.code).toBe("NO_REINFORCEMENT");
    const recalled = await json(app, `/api/v1/marches/${march.id}/recall`, {
      method: "POST",
      token: tokenA,
    });
    expect(recalled.res.status).toBe(200);
    expect(recalled.body.march.status).toBe("returning");
  });
});

describe("Commanders API (locked shape)", () => {
  const LOCKED_KEYS = [
    "attack",
    "busyMarchId",
    "defense",
    "id",
    "leadership",
    "life",
    "name",
    "stars",
    "state",
    "woundedUntil",
    "xp",
  ].sort();

  it("recruit → roster → march with commanderId", async () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const app = createApp(world);

    const a = await json(app, "/api/v1/auth/guest", {
      method: "POST",
      body: JSON.stringify({ displayName: "CmdApi", faction: "northern_kingdom" }),
    });
    expect(a.res.status).toBe(200);
    const tokenA = a.body.token as string;
    const cityA = a.body.city.id as string;

    // Empty roster before recruiting
    const empty = await json(app, "/api/v1/commanders", { token: tokenA });
    expect(empty.res.status).toBe(200);
    expect(empty.body.commanders).toEqual([]);

    // Recruit without gallery → NO_GALLERY
    const blocked = await json(app, "/api/v1/commanders/recruit", {
      method: "POST",
      token: tokenA,
      body: "{}",
    });
    expect(blocked.res.status).toBe(400);
    expect(blocked.body.error.code).toBe("NO_GALLERY");

    // Build command_gallery L1 then recruit free
    const build = await json(app, `/api/v1/cities/${cityA}/buildings`, {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({ slotIndex: 4, buildingType: "command_gallery" }),
    });
    world.jobs.get(build.body.job.id)!.finishesAt = 0;
    world.tick();
    const rec = await json(app, "/api/v1/commanders/recruit", {
      method: "POST",
      token: tokenA,
      body: "{}",
    });
    expect(rec.res.status).toBe(200);
    expect(Object.keys(rec.body.commander).sort()).toEqual(LOCKED_KEYS);
    expect(rec.body.commander.state).toBe("available");
    expect(rec.body.commander.stars).toBe(1);
    expect(rec.body.commander.leadership).toBe(5);
    const commanderId = rec.body.commander.id;

    // Roster reflects it
    const roster = await json(app, "/api/v1/commanders", { token: tokenA });
    expect(roster.body.commanders).toHaveLength(1);
    expect(Object.keys(roster.body.commanders[0]).sort()).toEqual(LOCKED_KEYS);

    // March with commanderId → busy state
    const map = await json(app, "/api/v1/map/viewport?x0=0&y0=0&x1=39&y1=39", {
      token: tokenA,
    });
    const camp = map.body.camps.find((c: { level: number }) => c.level === 1);
    const march = await json(app, "/api/v1/marches", {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({
        fromCityId: cityA,
        intent: "scout",
        target: { type: "camp", id: camp.id, x: camp.x, y: camp.y },
        composition: { scout: 1 },
        commanderId,
      }),
    });
    expect(march.res.status).toBe(200);
    expect(march.body.march.commanderId).toBe(commanderId);
    const busyRoster = await json(app, "/api/v1/commanders", { token: tokenA });
    expect(busyRoster.body.commanders[0].state).toBe("busy");
    expect(busyRoster.body.commanders[0].busyMarchId).toBe(march.body.march.id);

    // Same commander again → COMMANDER_BUSY over HTTP
    const busy = await json(app, "/api/v1/marches", {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({
        fromCityId: cityA,
        intent: "scout",
        target: { type: "camp", id: camp.id, x: camp.x, y: camp.y },
        composition: { scout: 1 },
        commanderId,
      }),
    });
    expect(busy.res.status).toBe(400);
    expect(busy.body.error.code).toBe("COMMANDER_BUSY");

    // Foreign commanderId → NO_COMMANDER over HTTP
    const b = await json(app, "/api/v1/auth/guest", {
      method: "POST",
      body: JSON.stringify({ displayName: "CmdApiB", faction: "mountain_realm" }),
    });
    const foreign = await json(app, "/api/v1/marches", {
      method: "POST",
      token: b.body.token,
      body: JSON.stringify({
        fromCityId: b.body.city.id,
        intent: "scout",
        target: { type: "camp", id: camp.id, x: camp.x, y: camp.y },
        composition: { scout: 1 },
        commanderId,
      }),
    });
    expect(foreign.res.status).toBe(400);
    expect(foreign.body.error.code).toBe("NO_COMMANDER");
  });
});

describe("Shop API (catalog, buy, use)", () => {
  it("buys with Dracoliths and applies a shield via POST /shop/use", async () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const app = createApp(world);
    const guest = await json(app, "/api/v1/auth/guest", {
      method: "POST",
      body: JSON.stringify({ displayName: "ShopApi", faction: "northern_kingdom" }),
    });
    const token = guest.body.token as string;
    // Dracoliths are a scarce premium faucet — no starting balance.
    expect(guest.body.player.dracolith).toBe(0);

    // Catalog is content-driven.
    const catalog = await json(app, "/api/v1/shop/catalog");
    expect(catalog.body.catalog.map((i: { id: string }) => i.id)).toContain(
      "shield_12h",
    );

    const broke = await json(app, "/api/v1/shop/buy", {
      method: "POST",
      token,
      body: JSON.stringify({ itemId: "shield_12h" }),
    });
    expect(broke.res.status).toBe(400);
    expect(broke.body.error.code).toBe("NO_DRACOLITH");

    await json(app, "/api/v1/admin/grant", {
      method: "POST",
      token,
      body: JSON.stringify({ dracolith: 60 }),
    });
    const buy = await json(app, "/api/v1/shop/buy", {
      method: "POST",
      token,
      body: JSON.stringify({ itemId: "shield_12h" }),
    });
    expect(buy.res.status).toBe(200);
    expect(buy.body.dracolith).toBe(0);

    const inv = await json(app, "/api/v1/inventory", { token });
    expect(inv.body.items.shield_12h).toBe(1);

    const before = world.players.get(guest.body.player.id)!.protectionUntil!;
    const use = await json(app, "/api/v1/shop/use", {
      method: "POST",
      token,
      body: JSON.stringify({ itemId: "shield_12h" }),
    });
    expect(use.res.status).toBe(200);
    expect(use.body.effect).toEqual({ type: "shield_sec", seconds: 43200 });
    expect(use.body.applied.protectionUntil).toBe(before + 43200_000);

    const again = await json(app, "/api/v1/shop/use", {
      method: "POST",
      token,
      body: JSON.stringify({ itemId: "shield_12h" }),
    });
    expect(again.body.error.code).toBe("NO_ITEM");
  });

  it("rejects unauthenticated use and reports ITEM_UNUSABLE", async () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const app = createApp(world);
    const anon = await json(app, "/api/v1/shop/use", {
      method: "POST",
      body: JSON.stringify({ itemId: "speedup_1h" }),
    });
    expect(anon.res.status).toBe(401);

    const guest = await json(app, "/api/v1/auth/guest", {
      method: "POST",
      body: JSON.stringify({ displayName: "ShopUseApi" }),
    });
    const token = guest.body.token as string;
    await json(app, "/api/v1/admin/grant", {
      method: "POST",
      token,
      body: JSON.stringify({ dracolith: 20 }),
    });
    await json(app, "/api/v1/shop/buy", {
      method: "POST",
      token,
      body: JSON.stringify({ itemId: "speedup_1h" }),
    });
    const unusable = await json(app, "/api/v1/shop/use", {
      method: "POST",
      token,
      body: JSON.stringify({ itemId: "speedup_1h" }),
    });
    expect(unusable.res.status).toBe(400);
    expect(unusable.body.error.code).toBe("ITEM_UNUSABLE");
  });
});

describe("Auth session revocation", () => {
  it("logout revokes the session so the old token is rejected", async () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const app = createApp(world);
    const guest = await json(app, "/api/v1/auth/guest", {
      method: "POST",
      body: JSON.stringify({ displayName: "RevokeMe", faction: "northern_kingdom" }),
    });
    expect(guest.res.status).toBe(200);
    const token = guest.body.token as string;
    const playerId = guest.body.player.id as string;
    const sessionId = world.sessions.get(token)!.id;

    // Token authenticates before logout.
    const before = await json(app, "/api/v1/me", { token });
    expect(before.res.status).toBe(200);

    const out = await json(app, "/api/v1/auth/logout", { method: "POST", token });
    expect(out.res.status).toBe(204);

    // Old token is dead.
    const after = await json(app, "/api/v1/me", { token });
    expect(after.res.status).toBe(401);

    // Removed from every in-memory index…
    expect(world.sessions.has(token)).toBe(false);
    expect(
      [...world.sessionsById.values()].some((s) => s.playerId === playerId),
    ).toBe(false);
    expect(
      [...world.sessionsByHash.values()].some((s) => s.playerId === playerId),
    ).toBe(false);
    // …and recorded so the persistence layer drops the row.
    expect(world.deletedSessions.has(sessionId)).toBe(true);
  });

  it("logout revokes the session presented via cookie", async () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const app = createApp(world);
    const guestRes = await app.request("/api/v1/auth/guest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName: "CookieLogout", faction: "northern_kingdom" }),
    });
    expect(guestRes.status).toBe(200);
    const guest = await guestRes.json();
    const token = guest.token as string;
    const cookie = (guestRes.headers.get("set-cookie") ?? "").split(";")[0]!;
    expect(cookie).toContain("dragonwake_session=");

    const out = await app.request("/api/v1/auth/logout", {
      method: "POST",
      headers: { cookie },
    });
    expect(out.status).toBe(204);

    const after = await app.request("/api/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(after.status).toBe(401);
    expect(world.sessions.has(token)).toBe(false);
  });

  it("revokeSession returns false for unknown tokens and is idempotent", () => {
    const world = new World();
    expect(world.revokeSession("missing-token")).toBe(false);
    const { token } = world.createGuest("RevUnit", "northern_kingdom");
    expect(world.sessionPlayer(token)).not.toBeNull();
    expect(world.revokeSession(token)).toBe(true);
    expect(world.sessionPlayer(token)).toBeNull();
    // Second revoke finds nothing.
    expect(world.revokeSession(token)).toBe(false);
  });
});

describe("Session cookie flags", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  async function guestSetCookie(app: ReturnType<typeof createApp>, name: string) {
    const res = await app.request("/api/v1/auth/guest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName: name, faction: "northern_kingdom" }),
    });
    return res.headers.get("set-cookie") ?? "";
  }

  it("sets Secure in production but not for localhost dev; always HttpOnly + SameSite=Lax", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const prodCookie = await guestSetCookie(
      createApp(new World({ skipTutorial: true })),
      "CookieProd",
    );
    expect(prodCookie).toContain("dragonwake_session=");
    expect(prodCookie).toContain("HttpOnly");
    expect(prodCookie).toContain("SameSite=Lax");
    expect(prodCookie).toContain("Secure");

    vi.stubEnv("NODE_ENV", "development");
    const devCookie = await guestSetCookie(
      createApp(new World({ skipTutorial: true })),
      "CookieDev",
    );
    expect(devCookie).toContain("dragonwake_session=");
    expect(devCookie).toContain("HttpOnly");
    expect(devCookie).toContain("SameSite=Lax");
    expect(devCookie).not.toContain("Secure");
  });
});
