import { describe, expect, it } from "vitest";

import {
  dracolithLabel,
  knowledgeStateLabel,
  lifeStageLabel,
  physicalStateLabel,
  presenceStateLabel,
  resourceLabel,
  shopEffectLabel,
} from "./labels";

describe("lifecycle labels", () => {
  it("maps presence states case-insensitively (server sends uppercase)", () => {
    expect(presenceStateLabel("DORMANT")).toBe("Dormant");
    expect(presenceStateLabel("dormant")).toBe("Dormant");
    expect(presenceStateLabel("STIRRING")).toBe("Stirring");
    expect(presenceStateLabel("BATTLE_READY")).toBe("Battle ready");
    expect(presenceStateLabel("battle_ready")).toBe("Battle ready");
    expect(presenceStateLabel(undefined)).toBe("Dormant");
  });

  it("maps life stages and knowledge states case-insensitively", () => {
    expect(lifeStageLabel("HATCHLING")).toBe("Hatchling");
    expect(knowledgeStateLabel("SUPPORTED")).toBe("Supported");
    expect(knowledgeStateLabel("observed")).toBe("Observed");
    expect(physicalStateLabel("WOUNDED")).toBe("wounded");
  });

  it("names Dracoliths and describes Steward's Wares effects", () => {
    expect(resourceLabel("dracolith")).toBe("Dracoliths");
    expect(shopEffectLabel("speedup_sec", 3600)).toBe(
      "Completes the soonest construction/research/training 1h faster",
    );
    expect(shopEffectLabel("speedup_sec", 60)).toBe(
      "Completes the soonest construction/research/training 1m faster",
    );
    expect(shopEffectLabel("shield_sec", 43200)).toBe(
      "Extends protection 12h",
    );
  });

  it("singularizes a one-Dracolith count", () => {
    expect(dracolithLabel(1)).toBe("1 Dracolith");
    expect(dracolithLabel(2)).toBe("2 Dracoliths");
    expect(dracolithLabel(0)).toBe("0 Dracoliths");
    expect(dracolithLabel(1000)).toBe("1,000 Dracoliths");
  });
});
