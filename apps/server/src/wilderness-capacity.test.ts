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
});
