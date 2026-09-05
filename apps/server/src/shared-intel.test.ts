import { describe, expect, it } from "vitest";

import { World } from "./world";

describe("alliance shared intelligence", () => {
  it("forwards a scout report to alliance members", () => {
    const world = new World({ persist: false });
    const a = world.createGuest("Scout Lord", "northern_kingdom");
    const b = world.createGuest("Watch Lord", "mountain_realm");
    const alliance = world.createAlliance(a.player.id, "Shared Sight", "SIGHT");
    world.joinAlliance(b.player.id, alliance.id);
    const camp = [...world.camps.values()][0]!;
    const march = world.createMarch(a.player.id, {
      fromCityId: world.citiesForPlayer(a.player.id)[0]!.id,
      intent: "scout",
      targetType: "camp",
      targetId: camp.id,
      targetX: camp.x,
      targetY: camp.y,
      composition: { scout: 1 },
    });
    world.landMarch(march, march.arriveAt);
    expect(world.eventsSince(b.player.id, 0).some((event) => event.data?.kind === "shared_scout_intel")).toBe(true);
  });
});
