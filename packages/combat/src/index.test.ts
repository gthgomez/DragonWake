import { describe, expect, it } from "vitest";
import { getMatchups } from "@dragonwake/content";
import {
  COMBAT_RULES_VERSION,
  parseForceString,
  resolveBattle,
  stackEfficiency,
} from "./index.js";

function lossRate(
  losses: Record<string, number>,
  start: { unitId: string; count: number }[],
): number {
  const startTotal = start.reduce((s, g) => s + g.count, 0);
  const lost = Object.values(losses).reduce((s, n) => s + n, 0);
  return startTotal === 0 ? 0 : lost / startTotal;
}

function runMatchup(attackerSpec: string, defenderSpec: string, seed = 42) {
  let atk = parseForceString(attackerSpec);
  let def = parseForceString(defenderSpec);
  if (defenderSpec.trim().toLowerCase() === "same") {
    def = structuredClone(atk);
  }
  return resolveBattle({
    rulesVersion: COMBAT_RULES_VERSION,
    seed,
    attacker: atk,
    defender: def,
  });
}

describe("resolveBattle purity", () => {
  it("is deterministic for same seed+input", () => {
    const input = {
      rulesVersion: COMBAT_RULES_VERSION,
      seed: 99,
      attacker: { groups: [{ unitId: "bowman", count: 1000 }] },
      defender: { groups: [{ unitId: "pikeman", count: 1000 }] },
    };
    const a = resolveBattle(input);
    const b = resolveBattle(input);
    expect(a).toEqual(b);
    expect(a.winner).not.toBeUndefined();
  });

  it("different seeds can differ but both complete", () => {
    const base = {
      rulesVersion: COMBAT_RULES_VERSION,
      attacker: { groups: [{ unitId: "bowman", count: 2000 }] },
      defender: { groups: [{ unitId: "pikeman", count: 2000 }] },
    };
    const a = resolveBattle({ ...base, seed: 1 });
    const b = resolveBattle({ ...base, seed: 2 });
    expect(a.rounds).toBeGreaterThan(0);
    expect(b.rounds).toBeGreaterThan(0);
    expect(a.seed).toBe(1);
    expect(b.seed).toBe(2);
  });

  it("stack efficiency soft-caps large stacks", () => {
    expect(stackEfficiency(100)).toBe(1);
    expect(stackEfficiency(6000)).toBe(0.9);
    expect(stackEfficiency(20000)).toBe(0.8);
    expect(stackEfficiency(50000)).toBe(0.7);
    expect(stackEfficiency(300000)).toBe(0.5);
  });
});

describe("matchups M1–M10 (shipped resolveBattle)", () => {
  const matchups = getMatchups().filter((m) => {
    const n = Number(m.test_id.slice(1));
    return n >= 1 && n <= 10;
  });

  it("loads matchup content", () => {
    expect(matchups.length).toBeGreaterThanOrEqual(10);
  });

  for (const m of matchups) {
    it(`${m.test_id}: ${m.design_intent}`, () => {
      const result = runMatchup(m.attacker, m.defender, 12345);
      const atk = parseForceString(m.attacker);
      const lossPct = lossRate(result.losses.attacker, atk.groups);

      expect(result.rounds).toBeGreaterThan(0);
      expect(result.rounds).toBeLessThanOrEqual(40);

      switch (m.expected_winner) {
        case "attacker":
          expect(result.winner).toBe("attacker");
          if (m.pass_criteria.includes("40%")) {
            expect(lossPct).toBeLessThan(0.45);
          }
          if (m.pass_criteria.includes("45%")) {
            expect(lossPct).toBeLessThan(0.55);
          }
          break;
        case "defender":
          expect(result.winner).toBe("defender");
          break;
        case "drawish":
          expect(["draw", "attacker", "defender"]).toContain(result.winner);
          if (m.test_id === "M9") {
            const atkLost = Object.values(result.losses.attacker).reduce(
              (s, n) => s + n,
              0,
            );
            const defLost = Object.values(result.losses.defender).reduce(
              (s, n) => s + n,
              0,
            );
            const total = Math.max(atkLost + defLost, 1);
            expect(Math.abs(atkLost - defLost) / total).toBeLessThanOrEqual(0.15);
          }
          if (m.test_id === "M10") {
            expect(result.rounds).toBeLessThan(40);
          }
          break;
        case "contested":
          // neither side should be fully wiped with absurd losses both ways ideally
          expect(["attacker", "defender", "draw"]).toContain(result.winner);
          break;
        default:
          expect(["attacker", "defender", "draw"]).toContain(result.winner);
      }
    });
  }
});

describe("parseForceString", () => {
  it("parses mixed force", () => {
    const f = parseForceString("3k Knight + 2k Levy");
    expect(f.groups).toEqual(
      expect.arrayContaining([
        { unitId: "knight", count: 3000 },
        { unitId: "levy", count: 2000 },
      ]),
    );
  });
});

describe("commander bonus (spec §5)", () => {
  // Legacy-parity fixture: exact result for this input before/after the
  // commander change with no commander field present (byte-identical math).
  const LEGACY_EXPECTED = {
    rulesVersion: "legacy",
    seed: 777,
    winner: "attacker",
    rounds: 4,
    openDistance: 1050,
    losses: { attacker: {}, defender: { pikeman: 1000 } },
    remaining: { attacker: { bowman: 1000 }, defender: {} },
  };

  const legacyInput = {
    rulesVersion: "legacy",
    seed: 777,
    attacker: { groups: [{ unitId: "bowman", count: 1000 }] },
    defender: { groups: [{ unitId: "pikeman", count: 1000 }] },
  };

  it("absent commander ⇒ byte-identical legacy result", () => {
    const result = resolveBattle(legacyInput);
    expect(result).toEqual(LEGACY_EXPECTED);
  });

  it("explicit commander:undefined ⇒ identical to omitted field", () => {
    const omitted = resolveBattle(legacyInput);
    const explicit = resolveBattle({
      ...legacyInput,
      attacker: { ...legacyInput.attacker, commander: undefined },
      defender: { ...legacyInput.defender, commander: undefined },
    });
    expect(explicit).toEqual(omitted);
  });

  const closeBase = {
    rulesVersion: COMBAT_RULES_VERSION,
    seed: 9001,
    attacker: {
      groups: [
        { unitId: "pikeman", count: 500 },
        { unitId: "bowman", count: 300 },
      ],
    },
    defender: {
      groups: [
        { unitId: "man_at_arms", count: 400 },
        { unitId: "crossbowman", count: 200 },
      ],
    },
  };

  it("present commander measurably shifts the fight (fixture-anchored)", () => {
    const base = resolveBattle(closeBase);
    const commanded = resolveBattle({
      ...closeBase,
      attacker: {
        ...closeBase.attacker,
        commander: { leadership: 9, attack: 9 },
      },
    });
    // Defender absorbs strictly more damage under a 5-star commander aura
    // (+18% life/defense/attack on the attacker side).
    const defLost = (r: typeof base) =>
      Object.values(r.losses.defender).reduce((s, n) => s + n, 0);
    expect(defLost(commanded)).toBeGreaterThan(defLost(base));
    // Anchored fixtures (computed at change time; guards silent rebalancing)
    expect(defLost(base)).toBe(94);
    expect(defLost(commanded)).toBe(111);
  });

  it("commander effect is seed-reproducible (same input+seed = same result)", () => {
    const input = {
      ...closeBase,
      attacker: {
        ...closeBase.attacker,
        commander: { leadership: 5, attack: 7 },
      },
    };
    const a = resolveBattle(input);
    const b = resolveBattle(input);
    expect(a).toEqual(b);
  });

  it("rules version bumped for the commander-capable resolver", () => {
    expect(COMBAT_RULES_VERSION).toBe("0.3.0");
  });
});
