import { describe, expect, it } from "vitest";

import { World } from "./world";

describe("differentiated holding capabilities", () => {
  it("keeps specialist rosters at their authoritative holding", () => {
    const world = new World({ persist: false });
    const { player, city } = world.createGuest("Holding Lord", "northern_kingdom");
    world.adminGrant(player.id, { resources: { food: 10000, wood: 10000, stone: 10000, ore: 10000 } });
    city.research.dragon_studies = 3;
    expect(() => world.startTrain(city.id, player.id, "dragon_slayer", 1)).toThrow(/only be trained at a galeari/);
  });

  it("rejects charter research until world-earned prerequisites exist", () => {
    const world = new World({ persist: false });
    const { player, city } = world.createGuest("Charter Lord", "northern_kingdom");
    world.adminGrant(player.id, { resources: { food: 10000, wood: 10000, crownmark: 10000 } });
    expect(() => world.startResearch(city.id, player.id, "brinehold_unlock")).toThrow(
      /Marcher Keep, three camp victories, and one wilderness holding/,
    );
  });
});
