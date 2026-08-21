import { describe, expect, it } from "vitest";
import {
  parseCampComp,
  tickCityResources,
  World,
  type City,
} from "./world.js";

function sampleCity(overrides: Partial<City> = {}): City {
  return {
    id: "c1",
    playerId: "p1",
    realmId: 1,
    kind: "capital",
    name: "Test",
    mapX: 1,
    mapY: 1,
    resources: {
      food: 100,
      timber: 100,
      stone: 100,
      iron: 50,
      coin: 50,
    },
    defensePosture: "withdraw",
    lastResourceTick: 0,
    buildings: [{ slotIndex: 0, buildingType: "forge_heart", level: 1 }],
    plots: [
      { slotIndex: 0, plotType: "farm", level: 2 },
      { slotIndex: 1, plotType: null, level: 0 },
    ],
    stacks: { levy: 10 },
    research: {},
    ...overrides,
  };
}

describe("tickCityResources (shipped sim)", () => {
  it("increases resources over elapsed time", () => {
    const city = sampleCity({ lastResourceTick: 0 });
    const hour = 3_600_000;
    const next = tickCityResources(city, hour, []);
    expect(next.resources.food).toBeGreaterThan(city.resources.food);
    expect(next.resources.timber).toBeGreaterThan(city.resources.timber);
    expect(next.lastResourceTick).toBe(hour);
  });

  it("wild claims increase production", () => {
    const city = sampleCity({ lastResourceTick: 0 });
    const hour = 3_600_000;
    const base = tickCityResources(city, hour, []);
    const boosted = tickCityResources(city, hour, ["forest", "fertile_land", "quarry", "iron_hills"]);
    expect(boosted.resources.food).toBeGreaterThan(base.resources.food);
  });
});

describe("parseCampComp", () => {
  it("parses camp example compositions", () => {
    const g = parseCampComp("80 Levy + 20 Pikeman");
    expect(g).toEqual(
      expect.arrayContaining([
        { unitId: "levy", count: 80 },
        { unitId: "pikeman", count: 20 },
      ]),
    );
  });
});

describe("World daily quests + tutorial", () => {
  it("marks build/train quests and claims chronite once", () => {
    const world = new World({ devFastTime: true });
    const { player, city } = world.createGuest("QuestA", "northern_kingdom");
    world.startBuild(city.id, player.id, 2, "barracks");
    world.startTrain(city.id, player.id, "levy", 5);
    const list = world.listDailyQuests(player.id);
    expect(list.find((q) => q.id === "build")?.done).toBe(true);
    expect(list.find((q) => q.id === "train")?.done).toBe(true);
    const before = world.players.get(player.id)!.chronite;
    const claim = world.claimDailyQuest(player.id, "build");
    expect(claim.chronite).toBe(before + 2);
    expect(() => world.claimDailyQuest(player.id, "build")).toThrow(
      /already claimed/,
    );
  });

  it("advances tutorial to complete", () => {
    const world = new World({ devFastTime: true, skipTutorial: false });
    const { player } = world.createGuest("TutA", "forest_people");
    expect(world.tutorialView(player.id).completed).toBe(false);
    for (let i = 0; i < 10; i++) world.advanceTutorial(player.id);
    expect(world.tutorialView(player.id).completed).toBe(true);
  });
});

describe("World plots (grounds)", () => {
  it("assigns empty plot and upgrades with production gain", () => {
    const world = new World({ devFastTime: true });
    const { player, city } = world.createGuest("Plotter", "coastal_lords");
    const before = world.effectiveProduction(city);
    const plot = world.assignPlot(city.id, player.id, 0, "farm");
    expect(plot.plotType).toBe("farm");
    expect(plot.level).toBe(1);
    const mid = world.effectiveProduction(world.getCity(city.id)!);
    expect(mid.food).toBeGreaterThan(before.food);
    const up = world.upgradePlot(city.id, player.id, 0);
    expect(up.level).toBe(2);
    const after = world.effectiveProduction(world.getCity(city.id)!);
    expect(after.food).toBeGreaterThan(mid.food);
  });

  it("rejects invalid plot type and double-assign", () => {
    const world = new World({ devFastTime: true });
    const { player, city } = world.createGuest("PlotFail", "mountain_realm");
    expect(() =>
      world.assignPlot(city.id, player.id, 0, "not_a_plot"),
    ).toThrow(/invalid plot/);
    world.assignPlot(city.id, player.id, 1, "lumber_yard");
    expect(() =>
      world.assignPlot(city.id, player.id, 1, "farm"),
    ).toThrow(/already assigned/);
  });
});

describe("World queues + marches (shipped paths)", () => {
  it("completes train job under DEV_FAST_TIME via processQueues", () => {
    const world = new World({ devFastTime: true });
    const { player, city } = world.createGuest("Trainer", "northern_kingdom");
    const levyBefore = city.stacks.levy ?? 0;
    const job = world.startTrain(city.id, player.id, "levy", 5);
    // Force finish
    job.finishesAt = world.now() - 1;
    world.processQueues(world.now());
    const updated = world.getCity(city.id)!;
    expect(job.status).toBe("completed");
    expect(updated.stacks.levy).toBe(levyBefore + 5);
  });

  it("march lands once and produces battle report for camp attack", () => {
    const world = new World({ devFastTime: true });
    const { player, city } = world.createGuest("Attacker", "northern_kingdom");
    world.adminGrant(player.id, { units: { bowman: 200, levy: 100 } });
    const camp = [...world.camps.values()].find((c) => c.level === 1);
    expect(camp).toBeTruthy();
    const march = world.createMarch(player.id, {
      fromCityId: city.id,
      intent: "attack",
      targetType: "camp",
      targetId: camp!.id,
      targetX: camp!.x,
      targetY: camp!.y,
      composition: { bowman: 100, levy: 50 },
    });
    // Force land
    march.arriveAt = world.now() - 1;
    const report1 = world.landMarch(march, world.now());
    expect(report1).not.toBeNull();
    expect(report1!.result).toBeTruthy();
    expect(march.landCount).toBe(1);
    expect(march.battleReportId).toBe(report1!.id);

    // Second land is no-op (idempotent)
    const report2 = world.landMarch(march, world.now());
    expect(report2).toBeNull();
    expect(march.landCount).toBe(1);

    // Report stored
    expect(world.reports.get(report1!.id)).toBeTruthy();
    const battle = report1!.result.battle as { winner?: string };
    expect(battle?.winner || report1!.result.type).toBeTruthy();
  });

  it("occupy wilderness claims land on win", () => {
    const world = new World({ devFastTime: true });
    const { player, city } = world.createGuest("Settler", "mountain_realm");
    world.adminGrant(player.id, { units: { levy: 500, pikeman: 100 } });
    const wild = [...world.wilderness.values()][0]!;
    const march = world.createMarch(player.id, {
      fromCityId: city.id,
      intent: "occupy",
      targetType: "wilderness",
      targetId: wild.id,
      targetX: wild.x,
      targetY: wild.y,
      composition: { levy: 200, pikeman: 50 },
    });
    march.arriveAt = 0;
    const report = world.landMarch(march, world.now());
    expect(report).not.toBeNull();
    const updated = world.wilderness.get(wild.id)!;
    // On attacker win claim is set
    const battle = report!.result.battle as { winner: string };
    if (battle.winner === "attacker") {
      expect(updated.ownerPlayerId).toBe(player.id);
    }
  });

  it("two guests get different city tiles", () => {
    const world = new World({ devFastTime: true });
    const a = world.createGuest("Alpha", "northern_kingdom");
    const b = world.createGuest("Beta", "mountain_realm");
    expect(a.city.mapX !== b.city.mapX || a.city.mapY !== b.city.mapY).toBe(
      true,
    );
    expect(a.city.resources.food).toBeGreaterThan(0);
    expect(b.city.resources.food).toBeGreaterThan(0);
  });

  it("withdraw pvp loots without fighting stacks", () => {
    const world = new World({ devFastTime: true });
    const a = world.createGuest("Raider", "northern_kingdom");
    const b = world.createGuest("Victim", "mountain_realm");
    world.adminGrant(a.player.id, {
      units: { levy: 100 },
      skipProtection: true,
    });
    world.adminGrant(b.player.id, { skipProtection: true });
    world.setPosture(b.city.id, b.player.id, "withdraw");
    const beforeKelp = b.city.resources.food;
    const march = world.createMarch(a.player.id, {
      fromCityId: a.city.id,
      intent: "attack",
      targetType: "city",
      targetId: b.city.id,
      targetX: b.city.mapX,
      targetY: b.city.mapY,
      composition: { levy: 50 },
    });
    march.arriveAt = 0;
    const report = world.landMarch(march, world.now());
    expect(report).not.toBeNull();
    expect(report!.result.harborLoot).toBe(true);
    const victim = world.getCity(b.city.id)!;
    expect(victim.resources.food).toBeLessThanOrEqual(beforeKelp);
  });

  it("tideband create/join/chat", () => {
    const world = new World({ devFastTime: true });
    const a = world.createGuest("Leader", "northern_kingdom");
    const b = world.createGuest("Member", "coastal_lords");
    const ally = world.createAlliance(a.player.id, "Salt League", "SALT");
    world.joinAlliance(b.player.id, ally.id);
    const msg = world.postChat(a.player.id, ally.id, "Welcome to the Tideband");
    expect(msg.body).toContain("Tideband");
    const members = [...world.allianceMembers.values()].filter(
      (m) => m.allianceId === ally.id,
    );
    expect(members).toHaveLength(2);
  });

  it("harness grant enables complete harness; brinehold found", () => {
    const world = new World({ devFastTime: true });
    const { player } = world.createGuest("SovLord", "forest_people");
    world.adminGrant(player.id, { harness: true, brineholdUnlock: true });
    const sov = [...world.sovereigns.values()].find(
      (s) => s.playerId === player.id,
    )!;
    expect(world.harnessComplete(sov)).toBe(true);
    const brine = world.foundBrinehold(player.id, "Deep Brine");
    expect(brine.kind).toBe("brinehold");
    expect(brine.stacks.shieldman).toBeGreaterThan(0);
  });

  it("S1.1 stonekeel requires brinehold and grants exclusive stacks", () => {
    const world = new World({ devFastTime: true });
    const { player } = world.createGuest("StoneLord", "coastal_lords");
    world.adminGrant(player.id, {
      brineholdUnlock: true,
      stonekeelUnlock: true,
    });
    expect(() => world.foundStonekeel(player.id)).toThrow(/requires brinehold/);
    world.foundBrinehold(player.id, "First Hold");
    const stone = world.foundStonekeel(player.id, "Keel Rock");
    expect(stone.kind).toBe("stonekeel");
    expect(stone.stacks.sapper).toBeGreaterThan(0);
    expect(stone.stacks.heavy_pikeman).toBeGreaterThan(0);
    expect(() => world.foundStonekeel(player.id)).toThrow(/already own/);
  });

  it("full posture pvp runs resolveBattle and can reduce defender stacks", () => {
    const world = new World({ devFastTime: true });
    const a = world.createGuest("FullRaider", "northern_kingdom");
    const b = world.createGuest("FullWall", "mountain_realm");
    world.adminGrant(a.player.id, {
      units: { bowman: 400, levy: 200 },
      skipProtection: true,
    });
    world.adminGrant(b.player.id, {
      units: { levy: 80, pikeman: 40 },
      skipProtection: true,
    });
    world.setPosture(b.city.id, b.player.id, "full");
    const defBefore =
      (world.getCity(b.city.id)!.stacks.levy ?? 0) +
      (world.getCity(b.city.id)!.stacks.pikeman ?? 0);
    const march = world.createMarch(a.player.id, {
      fromCityId: a.city.id,
      intent: "attack",
      targetType: "city",
      targetId: b.city.id,
      targetX: b.city.mapX,
      targetY: b.city.mapY,
      composition: { bowman: 300, levy: 100 },
    });
    march.arriveAt = 0;
    const report = world.landMarch(march, world.now());
    expect(report).not.toBeNull();
    expect(report!.result.harborLoot).toBeFalsy();
    expect(report!.result.type).toBe("pvp");
    const battle = report!.result.battle as {
      winner: string;
      rounds: number;
      losses: { defender: Record<string, number> };
    };
    expect(battle.winner).toBeTruthy();
    expect(typeof battle.rounds).toBe("number");
    // Full fight path: battle object present (not harbor free-loot note)
    expect(battle.rounds >= 0).toBe(true);
    const defAfter =
      (world.getCity(b.city.id)!.stacks.levy ?? 0) +
      (world.getCity(b.city.id)!.stacks.pikeman ?? 0);
    // On attacker win, defender stacks should drop; on defender win still may take losses
    const defLosses = Object.values(battle.losses.defender ?? {}).reduce(
      (s, n) => s + (Number(n) || 0),
      0,
    );
    if (defLosses > 0) {
      expect(defAfter).toBeLessThan(defBefore);
    }
    expect(world.reports.get(report!.id)).toBeTruthy();
  });

  it("scout returns structured intel for camp and city", () => {
    const world = new World({ devFastTime: true });
    const a = world.createGuest("ScoutA", "northern_kingdom");
    const b = world.createGuest("ScoutB", "mountain_realm");
    world.adminGrant(a.player.id, {
      units: { levy: 20 },
      skipProtection: true,
    });
    world.adminGrant(b.player.id, { skipProtection: true });
    world.setPosture(b.city.id, b.player.id, "full");
    const camp = [...world.camps.values()].find((c) => c.level === 1)!;
    const campMarch = world.createMarch(a.player.id, {
      fromCityId: a.city.id,
      intent: "scout",
      targetType: "camp",
      targetId: camp.id,
      targetX: camp.x,
      targetY: camp.y,
      composition: { levy: 5 },
    });
    campMarch.arriveAt = 0;
    const campReport = world.landMarch(campMarch, world.now());
    expect(campReport!.result.type).toBe("scout");
    const campIntel = campReport!.result.intel as {
      kind: string;
      level: number;
      threatBand: string;
    };
    expect(campIntel.kind).toBe("camp");
    expect(campIntel.level).toBe(1);
    expect(campIntel.threatBand).toBe("low");

    const cityMarch = world.createMarch(a.player.id, {
      fromCityId: a.city.id,
      intent: "scout",
      targetType: "city",
      targetId: b.city.id,
      targetX: b.city.mapX,
      targetY: b.city.mapY,
      composition: { levy: 5 },
    });
    cityMarch.arriveAt = 0;
    const cityReport = world.landMarch(cityMarch, world.now());
    const cityIntel = cityReport!.result.intel as {
      kind: string;
      defensePosture: string;
      troopBand: string;
      ownerName: string;
    };
    expect(cityIntel.kind).toBe("city");
    expect(cityIntel.defensePosture).toBe("full");
    expect(cityIntel.ownerName).toBe("ScoutB");
    expect(cityIntel.troopBand).toBeTruthy();
  });

  it("haul delivers cargo to own secondary city", () => {
    const world = new World({ devFastTime: true });
    const { player, city } = world.createGuest("Hauler", "coastal_lords");
    world.adminGrant(player.id, {
      units: { levy: 30 },
      brineholdUnlock: true,
      resources: { food: 500 },
    });
    const brine = world.foundBrinehold(player.id, "Cargo Dock");
    const origin = world.getCity(city.id)!;
    const kelpBeforeOrigin = origin.resources.food;
    const kelpBeforeDest = brine.resources.food;
    const march = world.createMarch(player.id, {
      fromCityId: city.id,
      intent: "haul",
      targetType: "city",
      targetId: brine.id,
      targetX: brine.mapX,
      targetY: brine.mapY,
      composition: { levy: 10 },
      cargo: { food: 200 },
    });
    expect(world.getCity(city.id)!.resources.food).toBe(kelpBeforeOrigin - 200);
    march.arriveAt = 0;
    const report = world.landMarch(march, world.now());
    expect(report!.result.type).toBe("haul");
    expect(report!.result.delivered).toBe(true);
    expect(world.getCity(brine.id)!.resources.food).toBe(kelpBeforeDest + 200);
  });

  it("haul to foreign non-alliance city bounces cargo home", () => {
    const world = new World({ devFastTime: true });
    const a = world.createGuest("HaulFailA", "northern_kingdom");
    const b = world.createGuest("HaulFailB", "mountain_realm");
    world.adminGrant(a.player.id, {
      units: { levy: 20 },
      resources: { timber: 300 },
    });
    const originKelp = world.getCity(a.city.id)!.resources.timber;
    const march = world.createMarch(a.player.id, {
      fromCityId: a.city.id,
      intent: "haul",
      targetType: "city",
      targetId: b.city.id,
      targetX: b.city.mapX,
      targetY: b.city.mapY,
      composition: { levy: 10 },
      cargo: { timber: 100 },
    });
    expect(world.getCity(a.city.id)!.resources.timber).toBe(
      originKelp - 100,
    );
    march.arriveAt = 0;
    const report = world.landMarch(march, world.now());
    expect(report!.result.delivered).toBe(false);
    expect(report!.result.reason).toBe("not_own_or_alliance_city");
    // Cargo returned to origin on failed delivery
    expect(world.getCity(a.city.id)!.resources.timber).toBe(originKelp);
  });
});
