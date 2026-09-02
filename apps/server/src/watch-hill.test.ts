import { describe, expect, it } from "vitest";
import { World, wildernessBenefit } from "./world.js";

describe("Watch Hill semantics", () => {
  it("adds scouting depth without minting dragon evidence", () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const { player, city } = world.createGuest("WatchHill", "northern_kingdom");
    const hill = [...world.wilderness.values()].find((w) => w.resourceType === "watch_hill")!;
    const beforeDepth = world.scoutIntelLevel(player.id);
    const beforeInventory = { ...(world.inventory.get(player.id) ?? {}) };
    world.adminGrant(player.id, { units: { bowman: 1000 } });
    const march = world.createMarch(player.id, {
      fromCityId: city.id,
      intent: "occupy",
      targetType: "wilderness",
      targetId: hill.id,
      targetX: hill.x,
      targetY: hill.y,
      composition: { bowman: 100 },
    });
    march.arriveAt = 0;
    world.landMarch(march, world.now());

    expect(world.scoutIntelLevel(player.id)).toBe(beforeDepth + hill.level);
    expect(wildernessBenefit(hill).kind).toBe("scouting");
    expect(world.inventory.get(player.id)).toEqual(beforeInventory);
  });
});
