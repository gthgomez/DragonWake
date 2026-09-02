import { describe, expect, it } from "vitest";

import { World } from "./world";

describe("Dragon War Council", () => {
  it("is gated by BATTLE_READY and persists a war plan item", () => {
    const world = new World({ persist: false });
    const { player } = world.createGuest("Council Lord", "northern_kingdom");
    const city = world.citiesForPlayer(player.id)[0]!;
    expect(() => world.startDragonWarCouncil(player.id)).toThrow(/battle-ready/);
    world.adminGrant(player.id, { items: { dragon_material: 1 } });
    world.dragonProgress.get(player.id)!.charterEarned = true;
    city.kind = "galeari";
    city.research.dragon_studies = 3;
    city.resources.food = 2000;
    city.resources.wood = 2000;
    city.resources.stone = 1000;
    const result = world.startDragonWarCouncil(player.id);
    expect(result.itemId).toBe("dragon_war_plan");
    expect(world.inventory.get(player.id)?.dragon_war_plan).toBe(1);
    expect(city.resources.food).toBe(1000);
  });

  it("turns the plan into a single-use Wyrm-Scarred hunt authorization", () => {
    const world = new World({ persist: false, devFastTime: true });
    const { player, city } = world.createGuest("Hunt Lord", "northern_kingdom");
    world.dragonPresence(player.id);
    const progress = world.dragonProgress.get(player.id)!;
    progress.charterEarned = true;
    city.kind = "galeari";
    city.research.dragon_studies = 3;
    city.buildings.find((building) => building.buildingType === "forge_heart")!.level = 10;
    city.buildings.push({ slotIndex: 7, buildingType: "rally_quay", level: 100 });
    city.resources.food = 10000;
    city.resources.wood = 10000;
    city.resources.stone = 10000;
    world.adminGrant(player.id, {
      units: { dragon_slayer: 4000 },
      items: { dragon_material: 1 },
    });
    const camp = [...world.camps.values()].find((candidate) => candidate.level === 8)!;
    expect(() => world.createMarch(player.id, {
      fromCityId: city.id,
      intent: "attack",
      targetType: "camp",
      targetId: camp.id,
      targetX: camp.x,
      targetY: camp.y,
      composition: { dragon_slayer: 4000 },
    })).toThrow(/Dragon War Council plan/);
    world.startDragonWarCouncil(player.id);
    const march = world.createMarch(player.id, {
      fromCityId: city.id,
      intent: "attack",
      targetType: "camp",
      targetId: camp.id,
      targetX: camp.x,
      targetY: camp.y,
      composition: { dragon_slayer: 4000 },
    });
    march.arriveAt = 0;
    const report = world.landMarch(march, world.now())!;
    const result = report.result as { battle: { winner: string }; dragonHuntRewarded: boolean };
    expect(result.battle.winner).toBe("attacker");
    expect(result.dragonHuntRewarded).toBe(true);
    expect(world.inventory.get(player.id)?.dragon_war_plan).toBe(0);
    expect(world.inventory.get(player.id)?.dragon_hunt_trophy).toBe(1);
    expect(world.landMarch(march, world.now())).toBeNull();
  });
});
