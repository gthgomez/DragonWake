import { describe, expect, it } from "vitest";

import {
  canAfford,
  costText,
  formatIntel,
  formatIntelForPlayer,
  resourceShortfall,
  shortfallText,
} from "./format";
import type { Resources } from "./types";

const res: Resources = { food: 300, wood: 10, stone: 0, ore: 0, crownmark: 0 };

describe("availability helpers", () => {
  it("lists only the resources the player cannot cover", () => {
    expect(resourceShortfall(res, { food: 500, wood: 40, stone: 0 })).toEqual([
      { resource: "food", have: 300, need: 500 },
      { resource: "wood", have: 10, need: 40 },
    ]);
  });

  it("formats a shortfall line with have / need", () => {
    expect(shortfallText(res, { food: 500 })).toBe("food 300 / 500");
    expect(shortfallText(res, { food: 100 })).toBe("");
  });

  it("formats a full cost line, skipping zero costs", () => {
    expect(costText({ food: 500, wood: 0, crownmark: 3 })).toBe(
      "500 food · 3 crownmarks",
    );
  });

  it("agrees with canAfford on the same inputs", () => {
    expect(canAfford(res, { food: 500 })).toBe(false);
    expect(canAfford(res, { food: 100 })).toBe(true);
  });
});

describe("intel formatting", () => {
  it("formats a known intel kind unchanged", () => {
    expect(
      formatIntel({
        kind: "camp",
        level: 4,
        threatBand: "high",
        exampleComp: "3 spears",
      }),
    ).toBe("Level 4 camp · threat high · mustering roughly 3 spears");
    expect(
      formatIntelForPlayer({
        kind: "wilderness",
        resourceType: "iron_hills",
        level: 2,
      }),
    ).toBe("Iron Hills (level 2) · unclaimed");
  });

  it("falls back to the server summary for an unknown kind", () => {
    const payload = { kind: "empty", summary: "Nothing but dust here." };
    expect(formatIntel(payload)).toBe("");
    expect(formatIntelForPlayer(payload)).toBe("Nothing but dust here.");
  });

  it("never renders raw JSON for unknown array or object kinds", () => {
    const unknownObject = { kind: "mystery", secretId: "abc123" };
    expect(formatIntelForPlayer(unknownObject)).toBe("");
    expect(formatIntelForPlayer(unknownObject)).not.toContain("secretId");

    const unknownArray = [{ kind: "mystery", secretId: "abc123" }];
    expect(formatIntelForPlayer(unknownArray)).toBe("");

    expect(formatIntelForPlayer(42)).toBe("");
    expect(formatIntelForPlayer(null)).toBe("");
  });
});
