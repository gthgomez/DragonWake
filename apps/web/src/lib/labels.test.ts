import { describe, expect, it } from "vitest";

import {
  knowledgeStateLabel,
  lifeStageLabel,
  physicalStateLabel,
  presenceStateLabel,
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
});
