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

  it("pauses population growth while starving and resumes once food returns", () => {
    const world = fresh();
    const { city } = world.createGuest("UpkF", "northern_kingdom");
    // A host whose upkeep (200/h) out-eats the fields (120/h) leaves the
    // stores dry at zero, so the settlement is genuinely starving.
    city.stacks = { levy: 200 };
    city.resources.food = 0;
    city.lastResourceTick = 0;
    const before = city.population;
    expect(before).toBeGreaterThan(0);
    expect(before).toBeLessThan(city.maxPopulation);

    const starving = tickCityResources(city, 3_600_000); // one hour
    expect(isCityStarving(starving)).toBe(true);
    expect(starving.resources.food).toBe(0);
    // Growth is paused while the host goes hungry.
    expect(starving.population).toBe(before);

    // Relieve the host and restock the stores: the next hour grows again.
    starving.stacks = { levy: 1 };
    starving.resources.food = 1_000;
    const recovering = tickCityResources(starving, 2 * 3_600_000);
    expect(isCityStarving(recovering)).toBe(false);
    expect(recovering.population).toBeGreaterThan(before);
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
