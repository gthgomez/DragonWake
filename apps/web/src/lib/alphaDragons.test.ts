import { describe, expect, it } from "vitest";

import {
  ALPHA_DRAGON_STILLS,
  ALPHA_HATCHLING_ART,
  ALPHA_ROOST_PRESENCE_PLATE,
  roostArtSrc,
  signatureStudySrc,
  speciesArtSrc,
} from "./alphaDragons";

describe("alphaDragons", () => {
  it("maps canon Bestiary ids to wild-ecology studies", () => {
    expect(speciesArtSrc("ash_drake")).toMatch(/ash-drake\.png$/);
    expect(speciesArtSrc("ironback_wyrm")).toMatch(/ironback-wyrm\.png$/);
    expect(speciesArtSrc("ridgeback_wyvern")).toMatch(
      /ridgeback-wyvern\.png$/,
    );
  });

  it("does not invent art for unknown or unmatched ids", () => {
    expect(speciesArtSrc("valley_drake")).toBeUndefined();
    expect(speciesArtSrc("mountain_wyrm")).toBeUndefined();
    expect(speciesArtSrc("not_a_creature")).toBeUndefined();
  });

  it("swaps roost studies by physical state", () => {
    expect(roostArtSrc()).toMatch(/wyrm-roost-perch\.png$/);
    expect(roostArtSrc("healthy")).toMatch(/wyrm-roost-perch\.png$/);
    expect(roostArtSrc("wounded")).toMatch(/wyrm-roost-wounded\.png$/);
  });

  it("uses the hatchling study for a hatchling signature", () => {
    expect(signatureStudySrc("hatchling", "healthy")).toBe(ALPHA_HATCHLING_ART);
    expect(signatureStudySrc("wyrmling", "wounded")).toMatch(
      /wyrm-roost-wounded\.png$/,
    );
  });

  it("keeps the presence plate under plates and every still resolvable", () => {
    expect(ALPHA_ROOST_PRESENCE_PLATE).toContain("/plates/roost-presence.png");
    const root = "/art/alpha/imagine-explorations/";
    for (const still of ALPHA_DRAGON_STILLS) {
      expect(still.src.startsWith(root)).toBe(true);
      expect(still.src.endsWith(".png")).toBe(true);
    }
  });
});
