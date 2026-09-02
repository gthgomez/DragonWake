import { describe, expect, it } from "vitest";
import { World } from "./world.js";

describe("incoming intelligence", () => {
  it("warns the defender when an attack departs without leaking composition", () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const a = world.createGuest("WarningA", "northern_kingdom");
    const b = world.createGuest("WarningB", "mountain_realm");
    world.adminGrant(a.player.id, { units: { bowman: 10 } });
    const march = world.createMarch(a.player.id, { fromCityId: a.city.id, intent: "attack", targetType: "city", targetId: b.city.id, targetX: b.city.mapX, targetY: b.city.mapY, composition: { bowman: 5 } });
    const events = world.eventsSince(b.player.id, 0);
    const warning = events.find((event) => event.data?.kind === "incoming_attack");
    expect(warning?.data?.marchId).toBe(march.id);
    expect(warning?.message).toMatch(/Incoming attack detected/);
    expect(JSON.stringify(warning)).not.toContain("bowman");
  });
});
