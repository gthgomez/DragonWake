import { describe, expect, it } from "vitest";
import { canonResourceBag, canonResourceId } from "@dragonwake/content";

describe("final resource-domain compatibility", () => {
  it("maps aquatic saves directly to final ids", () => {
    expect(canonResourceBag({ kelp: 10, driftwood: 20, basalt: 30, slagiron: 40, tidegilt: 50 }))
      .toEqual({ food: 10, wood: 20, stone: 30, ore: 40, crownmark: 50 });
  });

  it("maps intermediate saves to final ids", () => {
    expect(canonResourceBag({ food: 10, timber: 20, stone: 30, iron: 40, coin: 50 }))
      .toEqual({ food: 10, wood: 20, stone: 30, ore: 40, crownmark: 50 });
  });

  it("is idempotent and does not duplicate mixed aliases", () => {
    const mixed = canonResourceBag({ timber: 100, wood: 200, iron: 40, ore: 60, coin: 5, crownmark: 9 });
    expect(mixed).toEqual({ wood: 200, ore: 60, crownmark: 9 });
    expect(canonResourceBag(mixed)).toEqual(mixed);
  });

  it("recognizes the controlled compatibility vocabulary", () => {
    expect(canonResourceId("wood")).toBe("wood");
    expect(canonResourceId("driftwood")).toBe("wood");
    expect(canonResourceId("not_a_resource")).toBe("not_a_resource");
  });
});
