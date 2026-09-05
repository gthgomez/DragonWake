import { describe, expect, it } from "vitest";
import { World } from "./world.js";

describe("wilderness capacity", () => {
  it("rejects a third holding before troops leave the city", () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const { player, city } = world.createGuest("WildCap", "northern_kingdom");
    world.adminGrant(player.id, { units: { bowman: 1000 } });
    const wilds = [...world.wilderness.values()].slice(0, 3);
    for (const wild of wilds.slice(0, 2)) {
      const march = world.createMarch(player.id, { fromCityId: city.id, intent: "occupy", targetType: "wilderness", targetId: wild.id, targetX: wild.x, targetY: wild.y, composition: { bowman: 100 } });
      march.arriveAt = 0;
      world.landMarch(march, world.now());
    }
    const troopsBefore = world.getCity(city.id)!.stacks.bowman;
    expect(() => world.createMarch(player.id, { fromCityId: city.id, intent: "occupy", targetType: "wilderness", targetId: wilds[2]!.id, targetX: wilds[2]!.x, targetY: wilds[2]!.y, composition: { bowman: 100 } })).toThrow(/capacity reached/);
    expect(world.getCity(city.id)!.stacks.bowman).toBe(troopsBefore);
  });

  it("allows the owner to abandon a holding and reclaim the slot", () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const { player } = world.createGuest("WildRelease", "northern_kingdom");
    const wild = [...world.wilderness.values()][0]!;
    wild.ownerPlayerId = player.id;
    world.abandonWilderness(player.id, wild.id);
    expect(wild.ownerPlayerId).toBeNull();
    expect(world.ownedWildernessCount(player.id)).toBe(0);
  });

  it("changes wilderness ownership once and moves the production bonus", () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const oldOwner = world.createGuest("Old Wildlord", "northern_kingdom");
    const newOwner = world.createGuest("New Wildlord", "mountain_realm");
    const wild = [...world.wilderness.values()].find((candidate) => !candidate.ownerPlayerId)!;
    wild.ownerPlayerId = oldOwner.player.id;
    const oldWood = world.effectiveProduction(oldOwner.city).wood;
    const newWood = world.effectiveProduction(newOwner.city).wood;
    world.adminGrant(newOwner.player.id, { units: { bowman: 1000 } });
    const march = world.createMarch(newOwner.player.id, {
      fromCityId: newOwner.city.id,
      intent: "occupy",
      targetType: "wilderness",
      targetId: wild.id,
      targetX: wild.x,
      targetY: wild.y,
      composition: { bowman: 100 },
    });
    march.arriveAt = 0;
    world.landMarch(march, world.now());
    expect(wild.ownerPlayerId).toBe(newOwner.player.id);
    expect(world.effectiveProduction(oldOwner.city).wood).toBe(oldWood - wild.level * 30);
    expect(world.effectiveProduction(newOwner.city).wood).toBe(newWood + wild.level * 30);
    expect(world.landMarch(march, world.now())).toBeNull();
  });

  it("rechecks capacity when delayed competing claims resolve", () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const { player, city } = world.createGuest("Race Wildlord", "northern_kingdom");
    world.adminGrant(player.id, { units: { bowman: 1000 } });
    const wilds = [...world.wilderness.values()].filter((candidate) => !candidate.ownerPlayerId).slice(0, 3);
    const marches = wilds.map((wild) => world.createMarch(player.id, {
      fromCityId: city.id,
      intent: "occupy",
      targetType: "wilderness",
      targetId: wild.id,
      targetX: wild.x,
      targetY: wild.y,
      composition: { bowman: 100 },
    }));
    for (const march of marches) march.arriveAt = 0;
    const first = world.landMarch(marches[0]!, world.now())!;
    const second = world.landMarch(marches[1]!, world.now())!;
    const third = world.landMarch(marches[2]!, world.now())!;
    expect((first.result as { wildernessClaimApplied: boolean }).wildernessClaimApplied).toBe(true);
    expect((second.result as { wildernessClaimApplied: boolean }).wildernessClaimApplied).toBe(true);
    expect((third.result as { wildernessClaimBlocked: boolean }).wildernessClaimBlocked).toBe(true);
    expect(wilds[0]!.ownerPlayerId).toBe(player.id);
    expect(wilds[1]!.ownerPlayerId).toBe(player.id);
    expect(wilds[2]!.ownerPlayerId).toBeNull();
  });
});
