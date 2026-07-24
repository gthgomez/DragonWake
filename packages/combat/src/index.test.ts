import { describe, expect, it } from "vitest";
import { resolveBattle } from "./index.js";

describe("resolveBattle scaffold", () => {
  it("returns a structured draw result", () => {
    const result = resolveBattle({
      rulesVersion: "0.1.0-scaffold",
      seed: 1,
      attacker: { groups: [{ unitId: "levy", count: 10 }] },
      defender: { groups: [{ unitId: "levy", count: 10 }] },
    });
    expect(result.winner).toBe("draw");
    expect(result.seed).toBe(1);
  });
});
