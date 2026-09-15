import { describe, expect, it } from "vitest";

import { World } from "./world.js";

/**
 * The building gate message must name the required study (Lab Slice A):
 * a player who is told only "requires further research" cannot act on it.
 */
describe("building research gates", () => {
  it("names the required study when a gated building is not unlocked", () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const { player, city } = world.createGuest("GateA", "northern_kingdom");

    let err: { code?: string; message?: string } | undefined;
    try {
      // skyreost (Dragon Watch) is gated behind Dragon Studies 1.
      world.startBuild(city.id, player.id, 0, "skyreost");
    } catch (e) {
      err = e as { code?: string; message?: string };
    }

    expect(err?.code).toBe("BUILDING_LOCKED");
    expect(String(err?.message)).toMatch(/Dragon Studies level 1/);
  });

  it("clears the study gate once the research is present", () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const { player, city } = world.createGuest("GateB", "northern_kingdom");
    city.research.dragon_studies = 1;

    // Other gates (keep level, slots, cost) may still apply; the research gate
    // must no longer be the reason.
    let code: string | undefined;
    try {
      world.startBuild(city.id, player.id, 0, "skyreost");
    } catch (e) {
      code = (e as { code?: string }).code;
    }
    expect(code).not.toBe("BUILDING_LOCKED");
  });
});
