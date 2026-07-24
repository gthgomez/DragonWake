/**
 * Pure combat resolver scaffold (A0).
 * Full RPS / stack soft-caps / matchups land in A1.
 */

export type BattleGroup = {
  unitId: string;
  count: number;
};

export type SideInput = {
  groups: BattleGroup[];
};

export type BattleInput = {
  rulesVersion: string;
  seed: number;
  attacker: SideInput;
  defender: SideInput;
};

export type BattleResult = {
  rulesVersion: string;
  seed: number;
  winner: "attacker" | "defender" | "draw";
  rounds: number;
  losses: {
    attacker: Record<string, number>;
    defender: Record<string, number>;
  };
  note?: string;
};

/** Scaffold: returns draw. Implemented properly in slice A1. */
export function resolveBattle(input: BattleInput): BattleResult {
  return {
    rulesVersion: input.rulesVersion,
    seed: input.seed,
    winner: "draw",
    rounds: 0,
    losses: { attacker: {}, defender: {} },
    note: "A0 scaffold — full combat in A1",
  };
}

export const COMBAT_RULES_VERSION = "0.1.0-scaffold";
