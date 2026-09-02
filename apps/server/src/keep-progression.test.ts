import { describe, expect, it } from "vitest";
import { World, keepLevel } from "./world.js";

describe("Keep progression spine", () => {
  it("persists Forge-Heart upgrades and raises frontier capacity", () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const { player, city } = world.createGuest("KeepScale", "northern_kingdom");
    expect(keepLevel(city)).toBe(1);
    expect(world.wildernessCapacity(player.id)).toBe(2);
    const job = world.startKeepUpgrade(city.id, player.id);
    job.finishesAt = world.now() - 1;
    world.processQueues(world.now());
    expect(keepLevel(world.getCity(city.id)!)).toBe(2);
    expect(world.wildernessCapacity(player.id)).toBe(3);
    expect(world.troopsPerMarchCapacity(player.id)).toBe(750);
  });

  it("blocks an over-tier building before resources or a job are changed", () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const { player, city } = world.createGuest("KeepGate", "northern_kingdom");
    world.adminGrant(player.id, { resources: { food: 10000, wood: 10000, stone: 10000, ore: 10000 } });
    for (const level of [1, 2, 3]) {
      const job = world.startBuild(city.id, player.id, 2, "barracks");
      job.finishesAt = world.now() - 1;
      world.processQueues(world.now());
      expect(world.getCity(city.id)!.buildings.find((b) => b.slotIndex === 2)?.level).toBe(level);
    }
    const beforeResources = { ...world.getCity(city.id)!.resources };
    expect(() => world.startBuild(city.id, player.id, 2, "barracks")).toThrow(/Forge-Heart L2/);
    expect(world.getCity(city.id)!.resources).toEqual(beforeResources);
  });
});
