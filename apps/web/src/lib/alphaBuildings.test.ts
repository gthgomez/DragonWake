import { describe, expect, it } from "vitest";

import { ALPHA_BUILDING_ART, alphaBuildingSrc } from "./alphaBuildings";

describe("alphaBuildingSrc", () => {
  it("maps keep and buildable city types to alpha rasters", () => {
    expect(alphaBuildingSrc("forge_heart")).toMatch(/bld-keep\.png$/);
    expect(alphaBuildingSrc("habitation")).toMatch(/bld-homes\.png$/);
    expect(alphaBuildingSrc("barracks")).toMatch(/bld-barracks\.png$/);
    expect(alphaBuildingSrc("unknown_building")).toBeUndefined();
  });

  it("keeps every mapped file under the alpha explorations path", () => {
    for (const src of Object.values(ALPHA_BUILDING_ART)) {
      expect(src.startsWith("/art/alpha/imagine-explorations/buildings/")).toBe(
        true,
      );
    }
  });
});
