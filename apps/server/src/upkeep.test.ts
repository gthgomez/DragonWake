import { describe, expect, it } from "vitest";

import {
  World,
  cityFoodUpkeepPerHour,
  isCityStarving,
  tickCityResources,
} from "./world.js";

function fresh(): World {
  return new World({ devFastTime: true, skipTutorial: true });
}

/**
 * Option S — soft food upkeep for armies.
 * Per-troop hourly Food drain; under-payment has NO troop loss, it pauses
 * growth and blocks mustering. Rationing is the relief lever.
 */
describe("food upkeep (Option S, soft)", () => {
  it("derives hourly upkeep from standing companies' pop", () => {
    const world = fresh();
    const { city } = world.createGuest("UpkA", "northern_kingdom");
    // Starting stacks: levy 50 + porter 10 + scout 5, all pop 1 => 65 food/h.
    expect(cityFoodUpkeepPerHour(city)).toBeCloseTo(65, 5);
  });

  it("Rationing research reduces upkeep", () => {
    const world = fresh();
    const { city } = world.createGuest("UpkB", "northern_kingdom");
    const base = cityFoodUpkeepPerHour(city);
    city.research.rationing = 4;
    expect(cityFoodUpkeepPerHour(city)).toBeCloseTo(base * 0.8, 5);
  });

  it("drains food over time and clamps at zero (never negative)", () => {
    const world = fresh();
    const { city } = world.createGuest("UpkC", "northern_kingdom");
    city.stacks = { levy: 100000 };
    city.resources.food = 10;
    city.lastResourceTick = 0;

    const after = tickCityResources(city, 3_600_000); // one hour
    expect(after.resources.food).toBe(0);
    expect(isCityStarving(after)).toBe(true);
  });

  it("does not destroy troops when starving, but blocks mustering", () => {
    const world = fresh();
    const { player, city } = world.createGuest("UpkD", "northern_kingdom");
    city.resources.food = 0;
    city.stacks = { levy: 100 };

    let code: string | undefined;
    try {
      world.startTrain(city.id, player.id, "levy", 5);
    } catch (e) {
      code = (e as { code?: string }).code;
    }
    expect(code).toBe("STARVING");
    // Soft: the standing company is untouched.
    expect(world.getCity(city.id)!.stacks.levy).toBe(100);
  });

  it("keeps a fresh realm upkeep-positive before its first economy action", () => {
    const world = fresh();
    const { city } = world.createGuest("UpkE", "northern_kingdom");
    expect(world.effectiveProduction(city).food).toBeGreaterThan(
      world.foodUpkeepPerHour(city),
    );
    expect(world.isStarving(city)).toBe(false);
  });
});
