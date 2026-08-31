import { describe, expect, it } from "vitest";
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
        chronite: 100,
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

    // Shop chronite
    const buy = await json(app, "/api/v1/shop/buy", {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({ itemId: "speedup_1m" }),
    });
    expect(buy.body.itemId).toBe("speedup_1m");

    // Codex formulas
    const formulas = await json(app, "/api/v1/content/formulas");
    expect(formulas.body.formulas.rulesVersion).toBeTruthy();

    // Sovereign removed in M4 — /me carries no sovereign payload
    const me = await json(app, "/api/v1/me", { token: tokenA });
    expect(me.body.sovereigns).toBeUndefined();
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
