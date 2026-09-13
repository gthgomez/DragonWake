import { describe, expect, it } from "vitest";

import { ALPHA_BUILDING_ART, alphaBuildingSrc } from "./alphaBuildings";

describe("alphaBuildingSrc", () => {
  it("maps keep and buildable city types to alpha rasters", () => {
    expect(alphaBuildingSrc("forge_heart")).toMatch(/bld-keep\.png$/);
    expect(alphaBuildingSrc("habitation")).toMatch(/bld-homes\.png$/);
    expect(alphaBuildingSrc("barracks")).toMatch(/bld-barracks\.png$/);
    expect(alphaBuildingSrc("unknown_building")).toBeUndefined();
  });

  it("swaps stone / bronze / gold rasters by level bands", () => {
    expect(alphaBuildingSrc("forge_heart", 1)).toMatch(/bld-keep\.png$/);
    expect(alphaBuildingSrc("forge_heart", 4)).toMatch(/bld-keep-bronze\.png$/);
    expect(alphaBuildingSrc("forge_heart", 7)).toMatch(/bld-keep-gold\.png$/);
    expect(alphaBuildingSrc("habitation", 10)).toMatch(/bld-homes-gold\.png$/);
  });

  it("keeps every mapped file under the alpha explorations path", () => {
    for (const src of Object.values(ALPHA_BUILDING_ART)) {
      expect(src.startsWith("/art/alpha/imagine-explorations/buildings/")).toBe(
        true,
      );
    }
  });
});
