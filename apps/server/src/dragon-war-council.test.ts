import { describe, expect, it } from "vitest";

import { World } from "./world";

describe("Dragon War Council", () => {
  it("is gated by BATTLE_READY and persists a war plan item", () => {
    const world = new World({ persist: false });
    const { player } = world.createGuest("Council Lord");
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
});
