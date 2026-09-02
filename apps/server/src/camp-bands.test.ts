import { describe, expect, it } from "vitest";

import { campBand } from "./world";

describe("PvE mastery bands", () => {
  it("maps camp levels to the player-facing bands", () => {
    expect(campBand(1)).toBe("Bandit Camp");
    expect(campBand(3)).toBe("Bandit Camp");
    expect(campBand(4)).toBe("Raider Fort");
    expect(campBand(6)).toBe("Beast Den");
    expect(campBand(8)).toBe("Wyrm-Scarred Ruin");
  });
});
