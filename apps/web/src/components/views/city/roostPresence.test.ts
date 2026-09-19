import { describe, expect, it } from "vitest";

import { shouldRenderRoostDragon } from "./roostPresence";

describe("shouldRenderRoostDragon", () => {
  it("renders a dragon that is present in a known roost", () => {
    expect(shouldRenderRoostDragon({ slot: 7, away: false })).toBe(true);
    expect(shouldRenderRoostDragon({ slot: 0, away: false })).toBe(true);
  });

  it("leaves the roost actually empty when the dragon is away", () => {
    // Home Guard / approaches: no dragon image, no shadow, no fake occupant.
    expect(shouldRenderRoostDragon({ slot: 7, away: true })).toBe(false);
  });

  it("renders nothing when there is no roost slot", () => {
    expect(shouldRenderRoostDragon({ slot: null, away: false })).toBe(false);
    expect(shouldRenderRoostDragon(null)).toBe(false);
    expect(shouldRenderRoostDragon(undefined)).toBe(false);
  });
});
