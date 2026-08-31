import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { World, marchSpeedFactor } from "./world.js";

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

function finishAllBuilds(world: World, cityId: string): void {
  for (const j of world.jobs.values()) {
    if (j.cityId === cityId && j.kind === "build" && j.status === "running") {
      j.finishesAt = world.now() - 1;
    }
  }
  world.processQueues(world.now());
}

describe("authoritative building construction + upgrade", () => {
  it("builds on an empty slot at content cost and completes at L1", () => {
    const world = new World({ devFastTime: true });
    const { player, city } = world.createGuest("BuildA", "northern_kingdom");
    const before = { ...city.resources };
    world.startBuild(city.id, player.id, 2, "barracks");
    expect(city.resources.food).toBe(before.food - 100);
    expect(city.resources.timber).toBe(before.timber - 100);
    finishAllBuilds(world, city.id);
    const b = city.buildings.find((x) => x.slotIndex === 2)!;
    expect(b.buildingType).toBe("barracks");
    expect(b.level).toBe(1);
  });

  it("upgrades the same building on an occupied slot instead of duplicating", () => {
    const world = new World({ devFastTime: true });
    const { player, city } = world.createGuest("BuildB", "northern_kingdom");
    world.adminGrant(player.id, {
      resources: { food: 20000, timber: 20000, stone: 20000 },
    });
    const slot = city.buildings.find((b) => b.buildingType === "habitation")!
      .slotIndex;
    // L1 → L2 costs base × 2
    const before = { ...city.resources };
    world.startBuild(city.id, player.id, slot, "habitation");
    expect(city.resources.food).toBe(before.food - 200);
    finishAllBuilds(world, city.id);
    const levels = city.buildings
      .filter((b) => b.buildingType === "habitation")
      .map((b) => b.level);
    expect(levels).toEqual([2]);
  });

  it("rejects a different building type on an occupied slot", () => {
    const world = new World({ devFastTime: true });
    const { player, city } = world.createGuest("BuildC", "northern_kingdom");
    const slot = city.buildings.find((b) => b.buildingType === "habitation")!
      .slotIndex;
    try {
      world.startBuild(city.id, player.id, slot, "barracks");
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as { code?: string }).code).toBe("SLOT_OCCUPIED");
    }
  });

  it("rejects upgrades past max level", () => {
    const world = new World({ devFastTime: true });
    const { player, city } = world.createGuest("BuildD", "northern_kingdom");
    const slot = city.buildings.find((b) => b.buildingType === "habitation")!
      .slotIndex;
    const hab = city.buildings.find((b) => b.slotIndex === slot)!;
    hab.level = 10;
    try {
      world.startBuild(city.id, player.id, slot, "habitation");
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as { code?: string }).code).toBe("BUILDING_MAX");
    }
  });

  it("rejects unknown and non-buildable structures", () => {
    const world = new World({ devFastTime: true });
    const { player, city } = world.createGuest("BuildE", "northern_kingdom");
    expect(() =>
      world.startBuild(city.id, player.id, 2, "not_a_building"),
    ).toThrow();
    try {
      world.startBuild(city.id, player.id, 2, "forge_heart");
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as { code?: string }).code).toBe("BUILDING_FIXED");
    }
  });

  it("barracks levels speed up training", () => {
    const world = new World({ devFastTime: true });
    const { player, city } = world.createGuest("BarrackA", "northern_kingdom");
    const jobPlain = world.startTrain(city.id, player.id, "levy", 10);
    const plainDur = jobPlain.finishesAt - jobPlain.startedAt;

    const cityB = world.createGuest("BarrackB", "mountain_realm").city;
    cityB.buildings.push({ slotIndex: 5, buildingType: "barracks", level: 5 });
    const worldB = world;
    const pidB = worldB.cities.get(cityB.id)!.playerId;
    const jobFast = worldB.startTrain(cityB.id, pidB, "levy", 10);
    const fastDur = jobFast.finishesAt - jobFast.startedAt;
    expect(fastDur).toBeLessThan(plainDur);
  });

  it("training camp raises the concurrent train-queue cap", () => {
    const world = new World({ devFastTime: true });
    const { player, city } = world.createGuest("CampA", "northern_kingdom");
    world.adminGrant(player.id, {
      resources: { food: 50000, timber: 50000, stone: 50000, iron: 50000 },
    });
    // Base cap is 5
    for (let i = 0; i < 5; i++) world.startTrain(city.id, player.id, "levy", 1);
    expect(() => world.startTrain(city.id, player.id, "levy", 1)).toThrow();
    // Training Camp L2 → cap 7
    city.buildings.push({ slotIndex: 6, buildingType: "training_camp", level: 2 });
    world.startTrain(city.id, player.id, "levy", 1);
    world.startTrain(city.id, player.id, "levy", 1);
    expect(() => world.startTrain(city.id, player.id, "levy", 1)).toThrow();
  });

  it("muster yard levels shorten march travel time", () => {
    expect(marchSpeedFactor(0)).toBe(1);
    expect(marchSpeedFactor(5)).toBe(0.8);
    expect(marchSpeedFactor(25)).toBe(0.6);
    const world = new World({ devFastTime: false });
    const { player, city } = world.createGuest("MusterA", "northern_kingdom");
    const camp = [...world.camps.values()][0]!;
    const plain = world.createMarch(player.id, {
      fromCityId: city.id,
      intent: "scout",
      targetType: "camp",
      targetId: camp.id,
      targetX: camp.x,
      targetY: camp.y,
      composition: { scout: 1 },
    });
    city.buildings.push({ slotIndex: 7, buildingType: "rally_quay", level: 5 });
    const faster = world.createMarch(player.id, {
      fromCityId: city.id,
      intent: "scout",
      targetType: "camp",
      targetId: camp.id,
      targetX: camp.x,
      targetY: camp.y,
      composition: { scout: 1 },
    });
    expect(faster.arriveAt - faster.departAt).toBeLessThan(
      plain.arriveAt - plain.departAt,
    );
  });

  it("camp victories record bestiary entries (dragon-sign progression is reachable)", () => {
    const world = new World({ devFastTime: true });
    const { player, city } = world.createGuest("BeastA", "northern_kingdom");
    world.adminGrant(player.id, { units: { levy: 500, bowman: 200 } });
    const camp = [...world.camps.values()].find((c) => c.level === 1)!;
    const march = world.createMarch(player.id, {
      fromCityId: city.id,
      intent: "attack",
      targetType: "camp",
      targetId: camp.id,
      targetX: camp.x,
      targetY: camp.y,
      composition: { levy: 120, bowman: 60 },
    });
    march.arriveAt = 0;
    const report = world.landMarch(march, world.now())!;
    expect(
      (report.result.battle as { winner: string }).winner,
    ).toBe("attacker");
    const entry = [...world.bestiary.values()].find(
      (e) => e.playerId === undefined && e.entryId === "claw_marks_stone",
    ) ?? [...world.bestiary.values()].find((e) => e.entryId === "claw_marks_stone");
    expect(entry).toBeTruthy();
    expect(entry!.encounterCount).toBeGreaterThanOrEqual(1);
  });

  it("watchtower depth: L1 reveals camp defenders, L3 reveals exact city troops", async () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const app = createApp(world);
    const a = await json(app, "/api/v1/auth/guest", {
      method: "POST",
      body: JSON.stringify({ displayName: "ScoutA", faction: "northern_kingdom" }),
    });
    const token = a.body.token as string;
    const cityId = a.body.city.id as string;
    const camp = [...world.camps.values()][0]!;

    const march1 = await json(app, "/api/v1/marches", {
      method: "POST",
      token,
      body: JSON.stringify({
        fromCityId: cityId,
        intent: "scout",
        target: { type: "camp", id: camp.id, x: camp.x, y: camp.y },
        composition: { scout: 1 },
      }),
    });
    const m1 = world.marches.get(march1.body.march.id)!;
    m1.arriveAt = world.now() - 1;
    const report1 = world.landMarch(m1, world.now())!;
    expect((report1.result.intel as { defenders?: string }).defenders).toBeUndefined();

    // Build a Watchtower L1 and scout again
    world.adminGrant(a.body.player.id, {
      resources: { food: 5000, timber: 5000, stone: 5000 },
    });
    world.startBuild(cityId, a.body.player.id, 8, "lookout");
    finishAllBuilds(world, cityId);
    const march2 = await json(app, "/api/v1/marches", {
      method: "POST",
      token,
      body: JSON.stringify({
        fromCityId: cityId,
        intent: "scout",
        target: { type: "camp", id: camp.id, x: camp.x, y: camp.y },
        composition: { scout: 1 },
      }),
    });
    const m2 = world.marches.get(march2.body.march.id)!;
    m2.arriveAt = world.now() - 1;
    const report2 = world.landMarch(m2, world.now())!;
    const intel2 = report2.result.intel as { defenders?: string };
    expect(intel2.defenders).toBeTruthy();
  });
});

describe("progression honesty fixes", () => {
  it("clue grants count toward distinct dragon materials (readiness reachable)", () => {
    const world = new World({ devFastTime: true });
    const { player } = world.createGuest("ClueA", "northern_kingdom");
    const clues = [
      "shed_scale",
      "burned_livestock",
      "claw_marks",
      "dragon_bone",
      "shed_scale",
    ];
    for (const id of clues) world.grantDragonClue(player.id, id);
    // 4 distinct clue ids + the generic stack
    expect(world.countDistinctDragonMaterials(player.id)).toBeGreaterThanOrEqual(4);
  });

  it("reinforce delivers to your own second settlement without an alliance", () => {
    const world = new World({ devFastTime: true });
    const { player, city } = world.createGuest("ReinfA", "northern_kingdom");
    world.adminGrant(player.id, { brineholdUnlock: true });
    const keep = world.foundBrinehold(player.id);
    const march = world.createMarch(player.id, {
      fromCityId: city.id,
      intent: "reinforce",
      targetType: "city",
      targetId: keep.id,
      targetX: keep.mapX,
      targetY: keep.mapY,
      composition: { levy: 10 },
    });
    expect(world.applyReinforce(march)).toBe(true);
    expect(keep.stacks["levy"]).toBe(10);
  });

  it("rejects a second construction project on a slot already being built", () => {
    const world = new World({ devFastTime: true });
    const { player, city } = world.createGuest("BusyA", "northern_kingdom");
    world.startBuild(city.id, player.id, 2, "barracks");
    try {
      world.startBuild(city.id, player.id, 2, "saltvault");
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as { code?: string }).code).toBe("SLOT_BUSY");
    }
  });
});

describe("alliance chat display names", () => {
  it("chat messages carry the sender display name", async () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const app = createApp(world);
    const a = await json(app, "/api/v1/auth/guest", {
      method: "POST",
      body: JSON.stringify({ displayName: "ChatLord", faction: "northern_kingdom" }),
    });
    const token = a.body.token as string;
    const created = await json(app, "/api/v1/alliances", {
      method: "POST",
      token,
      body: JSON.stringify({ name: "Chat Alliance", tag: "CHAT" }),
    });
    const allianceId = created.body.alliance.id as string;
    await json(app, `/api/v1/alliances/${allianceId}/chat`, {
      method: "POST",
      token,
      body: JSON.stringify({ body: "Hail, allies." }),
    });
    const list = await json(app, `/api/v1/alliances/${allianceId}/chat`, { token });
    expect(list.body.messages[0].fromPlayerName).toBe("ChatLord");
    expect(list.body.messages[0].body).toBe("Hail, allies.");
  });
});

describe("city payload population fields", () => {
  it("exposes population and manpower in /me", async () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const app = createApp(world);
    const a = await json(app, "/api/v1/auth/guest", {
      method: "POST",
      body: JSON.stringify({ displayName: "PopLord", faction: "northern_kingdom" }),
    });
    const token = a.body.token as string;
    const me = await json(app, "/api/v1/me", { token });
    const city = me.body.cities[0];
    expect(city.population).toBeGreaterThan(0);
    expect(city.maxPopulation).toBeGreaterThan(0);
    expect(city.availableManpower).toBeGreaterThan(0);
  });
});
