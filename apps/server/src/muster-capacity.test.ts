import { describe, expect, it } from "vitest";
import { World } from "./world.js";

describe("Muster Yard capacity", () => {
  it("limits independent active operations", () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const { player, city } = world.createGuest("OpsCap", "northern_kingdom");
    world.adminGrant(player.id, { units: { scout: 100 } });
    const camps = [...world.camps.values()].slice(0, 5);
    for (const camp of camps.slice(0, 4)) {
      world.createMarch(player.id, { fromCityId: city.id, intent: "scout", targetType: "camp", targetId: camp.id, targetX: camp.x, targetY: camp.y, composition: { scout: 1 } });
    }
    expect(world.activeOperations(player.id)).toBe(4);
    expect(() => world.createMarch(player.id, { fromCityId: city.id, intent: "scout", targetType: "camp", targetId: camps[4]!.id, targetX: camps[4]!.x, targetY: camps[4]!.y, composition: { scout: 1 } })).toThrow(/operation capacity reached/);
  });

  it("rejects an oversized march before deducting troops", () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const { player, city } = world.createGuest("MarchCap", "northern_kingdom");
    world.adminGrant(player.id, { units: { bowman: 1000 } });
    const camp = [...world.camps.values()][0]!;
    const before = world.getCity(city.id)!.stacks.bowman;
    expect(() => world.createMarch(player.id, { fromCityId: city.id, intent: "attack", targetType: "camp", targetId: camp.id, targetX: camp.x, targetY: camp.y, composition: { bowman: 501 } })).toThrow(/Muster Yard allows/);
    expect(world.getCity(city.id)!.stacks.bowman).toBe(before);
  });
});
