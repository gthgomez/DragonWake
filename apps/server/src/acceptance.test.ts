/**
 * ACCEPTANCE_MVP M1–M11 as an automated two-session path.
 * Maps each manual step to assertions (no browser).
 */
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

function forceLand(world: World, marchId: string) {
  const m = world.marches.get(marchId)!;
  m.arriveAt = 0;
  world.tick();
  return m;
}

describe("ACCEPTANCE_MVP M1–M11 (scripted)", () => {
  it("completes full demo path with labeled steps", async () => {
    const world = new World({ devFastTime: true, skipTutorial: false });
    const app = createApp(world);

    // M1 — guest A Brinecant
    const a = await json(app, "/api/v1/auth/guest", {
      method: "POST",
      body: JSON.stringify({ displayName: "AcceptA", faction: "brinecant" }),
    });
    expect(a.res.status).toBe(200);
    expect(a.body.city.resources.kelp).toBeGreaterThan(0);
    expect(typeof a.body.city.mapX).toBe("number");
    const tokenA = a.body.token as string;
    const cityA = a.body.city.id as string;

    // M2 — guest B Ashcoil different tile
    const b = await json(app, "/api/v1/auth/guest", {
      method: "POST",
      body: JSON.stringify({ displayName: "AcceptB", faction: "ashcoil" }),
    });
    expect(b.res.status).toBe(200);
    const tokenB = b.body.token as string;
    expect(
      a.body.city.mapX !== b.body.city.mapX ||
        a.body.city.mapY !== b.body.city.mapY,
    ).toBe(true);

    // Prep troops / unlocks (M7 uses grant; allowed for demo)
    await json(app, "/api/v1/admin/grant", {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({
        units: { reefbow: 100, levy: 100 },
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

    // M3 — build Habitation + Barracks
    for (const [slot, buildingType] of [
      [2, "habitation"],
      [3, "barracks"],
    ] as const) {
      const build = await json(app, `/api/v1/cities/${cityA}/buildings`, {
        method: "POST",
        token: tokenA,
        body: JSON.stringify({ slotIndex: slot, buildingType }),
      });
      expect(build.body.job.kind).toBe("build");
      world.jobs.get(build.body.job.id)!.finishesAt = 0;
      world.tick();
    }
    const cityAfterBuild = world.getCity(cityA)!;
    expect(
      cityAfterBuild.buildings.some((x) => x.buildingType === "barracks"),
    ).toBe(true);

    // M4 — research Longmark + train Reefbows
    const research = await json(app, `/api/v1/cities/${cityA}/research`, {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({ techId: "longmark" }),
    });
    world.jobs.get(research.body.job.id)!.finishesAt = 0;
    world.tick();
    const train = await json(app, `/api/v1/cities/${cityA}/train`, {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({ unitId: "reefbow", count: 5 }),
    });
    world.jobs.get(train.body.job.id)!.finishesAt = 0;
    world.tick();
    expect(world.getCity(cityA)!.research.longmark).toBeGreaterThanOrEqual(1);
    expect(world.getCity(cityA)!.stacks.reefbow).toBeGreaterThan(0);

    // M5 — attack Camp L1
    const map = await json(app, "/api/v1/map/viewport?x0=0&y0=0&x1=39&y1=39", {
      token: tokenA,
    });
    const camp = map.body.camps.find((c: { level: number }) => c.level === 1);
    expect(camp).toBeTruthy();
    const campMarch = await json(app, "/api/v1/marches", {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({
        fromCityId: cityA,
        intent: "attack",
        target: { type: "camp", id: camp.id, x: camp.x, y: camp.y },
        composition: { reefbow: 80, levy: 40 },
      }),
    });
    const cm = forceLand(world, campMarch.body.march.id);
    expect(cm.battleReportId).toBeTruthy();
    const reports = await json(app, "/api/v1/reports", { token: tokenA });
    expect(reports.body.reports.length).toBeGreaterThan(0);

    // M6 — occupy wilderness
    const wild = map.body.wilderness[0];
    const occ = await json(app, "/api/v1/marches", {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({
        fromCityId: cityA,
        intent: "occupy",
        target: { type: "wilderness", id: wild.id, x: wild.x, y: wild.y },
        composition: { levy: 50 },
      }),
    });
    forceLand(world, occ.body.march.id);
    const wildAfter = world.wilderness.get(wild.id)!;
    expect(wildAfter.ownerPlayerId).toBe(a.body.player.id);

    // M7 — harness (granted above)
    const meHarness = await json(app, "/api/v1/me", { token: tokenA });
    expect(meHarness.body.sovereigns[0].harnessComplete).toBe(true);

    // M8 — Brinehold
    const brine = await json(app, "/api/v1/citadels/found-brinehold", {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({ name: "Accept Brine" }),
    });
    expect(brine.body.city.kind).toBe("brinehold");

    // M9 — Tideband create + B joins by tag + chat
    const ally = await json(app, "/api/v1/alliances", {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({ name: "Accept Band", tag: "ACC" }),
    });
    const listed = await json(app, "/api/v1/alliances", { token: tokenB });
    expect(
      listed.body.alliances.some((x: { tag: string }) => x.tag === "ACC"),
    ).toBe(true);
    const join = await json(app, "/api/v1/alliances/join", {
      method: "POST",
      token: tokenB,
      body: JSON.stringify({ tag: "ACC" }),
    });
    expect(join.res.status).toBe(200);
    await json(app, `/api/v1/alliances/${ally.body.alliance.id}/chat`, {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({ body: "M9 chat" }),
    });
    const chat = await json(
      app,
      `/api/v1/alliances/${ally.body.alliance.id}/chat`,
      { token: tokenB },
    );
    expect(
      chat.body.messages.some((m: { body: string }) => m.body === "M9 chat"),
    ).toBe(true);

    // M10 — PvP withdraw
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
    const pm = forceLand(world, pvp.body.march.id);
    expect(pm.battleReportId).toBeTruthy();

    // M11 — Codex formulas
    const formulas = await json(app, "/api/v1/content/formulas");
    expect(formulas.body.formulas.rulesVersion).toBeTruthy();

    // Tutorial + daily stubs (A10 freeze)
    const tut0 = await json(app, "/api/v1/tutorial", { token: tokenA });
    expect(tut0.body.tutorial.totalSteps).toBe(10);
    await json(app, "/api/v1/tutorial/advance", {
      method: "POST",
      token: tokenA,
    });
    const quests = await json(app, "/api/v1/quests/daily", { token: tokenA });
    expect(quests.body.quests.length).toBeGreaterThanOrEqual(3);
    const buildQ = quests.body.quests.find(
      (q: { id: string; done: boolean }) => q.id === "build",
    );
    expect(buildQ.done).toBe(true);
    const claim = await json(app, "/api/v1/quests/daily/build/claim", {
      method: "POST",
      token: tokenA,
    });
    expect(claim.res.status).toBe(200);
    expect(claim.body.chronite).toBeGreaterThanOrEqual(0);
  });
});
