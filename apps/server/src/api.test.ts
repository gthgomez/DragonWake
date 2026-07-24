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
      body: JSON.stringify({ displayName: "ApiA", faction: "brinecant" }),
    });
    expect(a.res.status).toBe(200);
    expect(a.body.city.resources.kelp).toBeGreaterThan(0);
    const tokenA = a.body.token as string;
    const cityA = a.body.city.id as string;

    const b = await json(app, "/api/v1/auth/guest", {
      method: "POST",
      body: JSON.stringify({ displayName: "ApiB", faction: "ashcoil" }),
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
        units: { reefbow: 300, levy: 200 },
        harness: true,
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
        composition: { reefbow: 100, levy: 50 },
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

    // PvP harbor
    await json(app, `/api/v1/cities/${b.body.city.id}/posture`, {
      method: "POST",
      token: tokenB,
      body: JSON.stringify({ posture: "harbor" }),
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

    // Harbinger harness
    const me = await json(app, "/api/v1/me", { token: tokenA });
    expect(me.body.sovereigns[0].harnessComplete).toBe(true);
  });
});
