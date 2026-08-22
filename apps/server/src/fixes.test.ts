/**
 * Regression tests for the hardening batch:
 * - economy: fractional resource accumulation + proportional population growth
 * - marches: failed reinforce returns troops instead of annihilating them
 * - queues: train manpower reservation (no double-spend) + job cap
 * - security: admin token gate, reports ownership, chat/map/sim auth
 * - content integrity gate data contract (zero errors, matchups resolve)
 */
import { describe, expect, it } from "vitest";
import { validateBattleContent } from "@tideforge/combat";
import { contentIntegrityIssues, getUnitById } from "@tideforge/content";
import { createApp } from "./app.js";
import { World, tickCityResources, productionPerHour } from "./world.js";

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

describe("economy: fractional resource accumulation", () => {
  it("1-second ticks accumulate sub-unit gains instead of truncating them", () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const { city } = world.createGuest("EcoTick", "northern_kingdom");
    let c = world.getCity(city.id)!;
    const start = { ...c.resources };
    const foodRate = productionPerHour(c).food; // base 120/h

    // Simulate one hour of the production loop's 1s ticks.
    for (let i = 0; i < 3600; i++) {
      c = tickCityResources(c, c.lastResourceTick + 1000);
    }
    const gainedFood = c.resources.food - start.food;
    // Old bug: floor-per-tick lost every fraction → gained ≈ 0.
    expect(gainedFood).toBeGreaterThanOrEqual(foodRate - 2);
    expect(gainedFood).toBeLessThanOrEqual(foodRate + 2);

    // Slow coin stream (20/h) also lands its ~20 units over the hour.
    expect(c.resources.coin - start.coin).toBeGreaterThanOrEqual(18);
    expect(c.resources.coin - start.coin).toBeLessThanOrEqual(22);
  });

  it("population grows proportionally with habitation, not +1 per tick", () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const { player, city } = world.createGuest("PopTick", "mountain_realm");
    const job = world.startBuild(city.id, player.id, 3, "habitation");
    job.finishesAt = world.now() - 1;
    world.processQueues(world.now());

    let c = world.getCity(city.id)!;
    // Starter city already has habitation; completing ours raises the cap.
    const maxPop = c.maxPopulation;
    expect(maxPop).toBeGreaterThan(c.population);
    const popStart = c.population;

    // Five minutes of 1s ticks: growth is ~pop*0.01/3600 per second → zero
    // whole units. The old Math.max(1, …) would have flooded +300 here.
    for (let i = 0; i < 300; i++) {
      c = tickCityResources(c, c.lastResourceTick + 1000);
    }
    expect(c.population).toBe(popStart);

    // A full two-hour jump grows exactly by rate × time × habitation levels.
    const habLevels = c.buildings
      .filter((b) => b.buildingType === "habitation")
      .reduce((sum, b) => sum + b.level, 0);
    expect(habLevels).toBeGreaterThan(0);
    const expected =
      popStart +
      Math.floor((c.popFraction ?? 0) + popStart * 0.01 * 2 * habLevels);
    c = tickCityResources(c, c.lastResourceTick + 2 * 3_600_000);
    expect(c.population).toBe(Math.min(maxPop, expected));

    // Cap is respected.
    for (let i = 0; i < 24; i++) {
      c = tickCityResources(c, c.lastResourceTick + 3_600_000);
    }
    expect(c.population).toBeLessThanOrEqual(maxPop);
  });
});

describe("marches: reinforce failure must not destroy troops", () => {
  it("non-allied reinforce target walks the army home intact", () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const a = world.createGuest("ReinA", "northern_kingdom");
    const b = world.createGuest("ReinB", "mountain_realm");
    const cityA = world.getCity(a.city.id)!;
    const cityB = world.getCity(b.city.id)!;
    const leviesBefore = cityA.stacks.levy ?? 0;

    const march = world.createMarch(a.player.id, {
      fromCityId: cityA.id,
      intent: "reinforce",
      targetType: "city",
      targetId: cityB.id,
      targetX: cityB.mapX,
      targetY: cityB.mapY,
      composition: { levy: 10 },
    });
    march.arriveAt = 0;
    world.landMarch(march, world.now());

    // Landed but undelivered — troops are returning, composition intact.
    expect(march.status).toBe("returning");
    expect(march.composition["levy"]).toBe(10);
    expect(cityB.stacks.levy ?? 0).toBe(50); // untouched starter stack

    march.returnAt = 0;
    world.processMarches(world.now());
    expect(world.getCity(cityA.id)!.stacks.levy).toBe(leviesBefore);
  });

  it("allied reinforce delivers troops and returns empty", () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const a = world.createGuest("AllyA", "northern_kingdom");
    const b = world.createGuest("AllyB", "forest_people");
    const alliance = world.createAlliance(a.player.id, "Hold Fast", "HOLD");
    world.joinAlliance(b.player.id, alliance.id);
    const cityA = world.getCity(a.city.id)!;
    const cityB = world.getCity(b.city.id)!;

    const march = world.createMarch(a.player.id, {
      fromCityId: cityA.id,
      intent: "reinforce",
      targetType: "city",
      targetId: cityB.id,
      targetX: cityB.mapX,
      targetY: cityB.mapY,
      composition: { levy: 10 },
    });
    march.arriveAt = 0;
    world.landMarch(march, world.now());
    expect(cityB.stacks.levy).toBe(60);
    expect(march.composition["levy"]).toBeUndefined();
    expect(march.status).toBe("returning");
  });
});

describe("queues: train manpower reservation", () => {
  it("parallel train jobs cannot double-spend free manpower", () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const { player, city } = world.createGuest("TrainRes", "northern_kingdom");
    const unit = getUnitById("levy")!;
    let c = world.getCity(city.id)!;
    // Fill all manpower except exactly one job's worth.
    const freeBefore = c.maxPopulation - c.usedManpower;
    const fill = freeBefore - unit.pop * 10;
    world.adminGrant(player.id, { units: { porter: fill / unit.pop } });
    c = world.getCity(city.id)!;
    const free = c.maxPopulation - c.usedManpower;
    expect(free).toBe(unit.pop * 10);

    const job1 = world.startTrain(city.id, player.id, "levy", 10);
    expect(job1.kind).toBe("train");

    // Second identical job has no unreserved manpower left.
    expect(() => world.startTrain(city.id, player.id, "levy", 5)).toThrow(
      /manpower/,
    );

    // Completing job1 releases the reservation and applies the units once.
    job1.finishesAt = world.now() - 1;
    world.processQueues(world.now());
    const after = world.getCity(city.id)!;
    expect(after.stacks.levy).toBe(60);
  });

  it("caps runaway train spam with QUEUE_FULL", () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const { player, city } = world.createGuest("TrainCap", "northern_kingdom");
    world.adminGrant(player.id, { resources: { food: 100_000 } });
    for (let i = 0; i < 5; i++) {
      world.startTrain(city.id, player.id, "levy", 1);
    }
    expect(() => world.startTrain(city.id, player.id, "levy", 1)).toThrow(
      /train queue full/,
    );
  });
});

describe("security gates", () => {
  it("admin grant requires the configured ADMIN_TOKEN", async () => {
    const prev = process.env.ADMIN_TOKEN;
    process.env.ADMIN_TOKEN = "secret-admin-token";
    try {
      const world = new World({ devFastTime: true, skipTutorial: true });
      const app = createApp(world);
      const guest = await json(app, "/api/v1/auth/guest", {
        method: "POST",
        body: JSON.stringify({ displayName: "TokGate" }),
      });
      const token = guest.body.token as string;
      const chroniteBefore = guest.body.player.chronite as number;

      const noHeader = await json(app, "/api/v1/admin/grant", {
        method: "POST",
        token,
        body: JSON.stringify({ chronite: 100 }),
      });
      expect(noHeader.res.status).toBe(403);

      const wrongHeader = await json(app, "/api/v1/admin/grant", {
        method: "POST",
        token,
        headers: { "x-admin-token": "wrong" },
        body: JSON.stringify({ chronite: 100 }),
      });
      expect(wrongHeader.res.status).toBe(403);

      const ok = await json(app, "/api/v1/admin/grant", {
        method: "POST",
        token,
        headers: { "x-admin-token": "secret-admin-token" },
        body: JSON.stringify({ chronite: 100 }),
      });
      expect(ok.res.status).toBe(200);
      expect(ok.body.me.chronite).toBe(chroniteBefore + 100);
    } finally {
      if (prev === undefined) delete process.env.ADMIN_TOKEN;
      else process.env.ADMIN_TOKEN = prev;
    }
  });

  it("reports are only readable by their attacker/defender", async () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const app = createApp(world);
    const a = await json(app, "/api/v1/auth/guest", {
      method: "POST",
      body: JSON.stringify({ displayName: "RepA" }),
    });
    const b = await json(app, "/api/v1/auth/guest", {
      method: "POST",
      body: JSON.stringify({ displayName: "RepB" }),
    });
    const tokenA = a.body.token as string;
    const tokenB = b.body.token as string;

    // A scouts → report owned solely by A.
    const camp = [...world.camps.values()].find((c) => c.level === 1)!;
    const m = world.createMarch(a.body.player.id, {
      fromCityId: a.body.city.id,
      intent: "scout",
      targetType: "camp",
      targetId: camp.id,
      targetX: camp.x,
      targetY: camp.y,
      composition: { scout: 1 },
    });
    m.arriveAt = 0;
    const report = world.landMarch(m, world.now())!;
    expect(report.attackerPlayerId).toBe(a.body.player.id);

    const ownerView = await json(app, `/api/v1/reports/${report.id}`, {
      token: tokenA,
    });
    expect(ownerView.res.status).toBe(200);

    const strangerView = await json(app, `/api/v1/reports/${report.id}`, {
      token: tokenB,
    });
    // 404, not 403 — no existence leak either way.
    expect(strangerView.res.status).toBe(404);
  });

  it("alliance chat read requires membership; map and sim endpoints require a session", async () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const app = createApp(world);
    const a = await json(app, "/api/v1/auth/guest", {
      method: "POST",
      body: JSON.stringify({ displayName: "ChatA" }),
    });
    const b = await json(app, "/api/v1/auth/guest", {
      method: "POST",
      body: JSON.stringify({ displayName: "ChatB" }),
    });
    const tokenA = a.body.token as string;
    const tokenB = b.body.token as string;

    const ally = await json(app, "/api/v1/alliances", {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({ name: "Secret Hold", tag: "SEC" }),
    });
    const allyId = ally.body.alliance.id as string;
    await json(app, `/api/v1/alliances/${allyId}/chat`, {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({ body: "members only" }),
    });

    const anon = await json(app, `/api/v1/alliances/${allyId}/chat`);
    expect(anon.res.status).toBe(401);

    const outsider = await json(app, `/api/v1/alliances/${allyId}/chat`, {
      token: tokenB,
    });
    expect(outsider.res.status).toBe(403);

    const member = await json(app, `/api/v1/alliances/${allyId}/chat`, {
      token: tokenA,
    });
    expect(member.res.status).toBe(200);
    expect(member.body.messages.some((m: { body: string }) => m.body === "members only")).toBe(true);

    const anonMap = await json(app, "/api/v1/map/viewport?x0=0&y0=0&x1=5&y1=5");
    expect(anonMap.res.status).toBe(401);

    const anonTile = await json(app, "/api/v1/map/tile?x=1&y=1");
    expect(anonTile.res.status).toBe(401);

    const anonTick = await json(app, "/api/v1/sim/tick", { method: "POST" });
    expect(anonTick.res.status).toBe(403);

    const memberTick = await json(app, "/api/v1/sim/tick", {
      method: "POST",
      token: tokenA,
    });
    expect(memberTick.res.status).toBe(200);
  });

  it("found-brinehold respects DEV_CITADEL_UNLOCK=0 even in dev", async () => {
    const prev = process.env.DEV_CITADEL_UNLOCK;
    process.env.DEV_CITADEL_UNLOCK = "0";
    try {
      const world = new World({ devFastTime: true, skipTutorial: true });
      const app = createApp(world);
      const g = await json(app, "/api/v1/auth/guest", {
        method: "POST",
        body: JSON.stringify({ displayName: "NoBrine" }),
      });
      const res = await json(app, "/api/v1/citadels/found-brinehold", {
        method: "POST",
        token: g.body.token,
        body: JSON.stringify({ name: "Should Fail" }),
      });
      expect(res.res.status).toBe(400);
      expect(res.body.error.code).toBe("DEV_DISABLED");
      expect(
        world.citiesForPlayer(g.body.player.id).some((c) => c.kind === "brinehold"),
      ).toBe(false);
    } finally {
      if (prev === undefined) delete process.env.DEV_CITADEL_UNLOCK;
      else process.env.DEV_CITADEL_UNLOCK = prev;
    }
  });
});

describe("content integrity gate contract", () => {
  it("shipped content has zero integrity errors and parsable matchups", () => {
    const errors = contentIntegrityIssues().filter((i) => i.severity === "error");
    expect(errors).toEqual([]);
    expect(validateBattleContent()).toEqual([]);
  });
});
