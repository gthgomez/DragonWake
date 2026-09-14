import { describe, expect, it } from "vitest";

import {
  canAfford,
  costText,
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
