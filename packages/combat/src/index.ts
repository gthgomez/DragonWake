/**
 * Pure, deterministic combat resolver (GDD §6.5).
 * No I/O. Server calls after march land; client only displays reports.
 */

import {
  getFormulas,
  getRps,
  getSovereignById,
  getStackEfficiency,
  getUnitById,
  type StackBand,
  type UnitDef,
} from "@tideforge/content";

export type BattleGroup = {
  unitId: string;
  count: number;
};

export type SideInput = {
  groups: BattleGroup[];
  sovereign?: { sovereignId: string; level?: number };
  /** Commander leadership bonus (spec §5); absent ⇒ legacy behavior. */
  commander?: { leadership: number; attack: number };
};

export type BattleInput = {
  rulesVersion: string;
  seed: number;
  attacker: SideInput;
  defender: SideInput;
  openDistanceOverride?: number;
};

export type BattleResult = {
  rulesVersion: string;
  seed: number;
  winner: "attacker" | "defender" | "draw";
  rounds: number;
  openDistance: number;
  losses: {
    attacker: Record<string, number>;
    defender: Record<string, number>;
  };
  remaining: {
    attacker: Record<string, number>;
    defender: Record<string, number>;
  };
  note?: string;
};

export const COMBAT_RULES_VERSION = "0.2.0";

const MAX_ROUNDS = 40;
const COMBAT_ROLES = new Set([
  "melee",
  "range",
  "speed",
  "sovereign",
  "scout",
  "logistics",
]);

type LiveGroup = {
  key: string;
  unitId: string;
  role: string;
  side: "attacker" | "defender";
  count: number;
  startCount: number;
  unitLife: number;
  unitAtk: number;
  unitRange: number;
  unitSpeed: number;
  unitDefense: number;
  unitPower: number;
  hp: number;
  pos: number;
  isSovereign: boolean;
  isCombat: boolean;
};

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function stackEfficiency(count: number, bands?: StackBand[]): number {
  const table = bands ?? (getStackEfficiency() as StackBand[]);
  for (const band of table) {
    if (count >= band.count_min && count <= band.count_max) {
      return band.efficiency;
    }
  }
  return 0.5;
}

function attackStat(unit: UnitDef): number {
  return Math.max(unit.melee_atk, unit.ranged_atk);
}

function buildGroups(
  side: SideInput,
  sideName: "attacker" | "defender",
  basePos: number,
): LiveGroup[] {
  const out: LiveGroup[] = [];
  let i = 0;
  for (const g of side.groups) {
    if (g.count <= 0) continue;
    const unit = getUnitById(g.unitId);
    if (!unit) continue;
    const life = unit.life;
    const count = Math.floor(g.count);
    out.push({
      key: `${sideName}:${g.unitId}:${i++}`,
      unitId: g.unitId,
      role: unit.role,
      side: sideName,
      count,
      startCount: count,
      unitLife: life,
      unitAtk: attackStat(unit),
      unitRange: unit.range,
      unitSpeed: unit.speed,
      unitDefense: unit.defense,
      unitPower: unit.power,
      hp: count * life,
      pos: basePos,
      isSovereign: false,
      isCombat: COMBAT_ROLES.has(unit.role),
    });
  }
  if (side.sovereign) {
    const sov = getSovereignById(side.sovereign.sovereignId);
    if (sov) {
      const level = side.sovereign.level ?? 1;
      const scale = 1 + (level - 1) * 0.05;
      const life = Math.floor(sov.life * scale);
      out.push({
        key: `${sideName}:sov:${sov.id}`,
        unitId: sov.id,
        role: "sovereign",
        side: sideName,
        count: 1,
        startCount: 1,
        unitLife: life,
        unitAtk: Math.max(sov.melee_atk, sov.ranged_atk) * scale,
        unitRange: sov.range,
        unitSpeed: sov.speed,
        unitDefense: sov.defense,
        unitPower: sov.power,
        hp: life,
        pos: basePos,
        isSovereign: true,
        isCombat: true,
      });
    }
  }
  return out;
}

/**
 * Commander leadership bonus (spec §5): every group on that side gets life and
 * defense ×(1 + 0.02 × leadership) and melee/ranged attack ×(1 + 0.02 ×
 * attack). Absent commander ⇒ no-op (byte-identical legacy math). Applied in
 * resolveBattle after unit-stat lookup, before the round loop; pure and
 * deterministic. Composes multiplicatively with the sovereign aura term.
 */
const COMMANDER_BONUS_PER_POINT = 0.02; // INITIAL_TEST_FIXTURE

function applyCommanderBonus(
  groups: LiveGroup[],
  commander: SideInput["commander"],
): void {
  if (!commander) return;
  const statMul = 1 + COMMANDER_BONUS_PER_POINT * commander.leadership;
  const atkMul = 1 + COMMANDER_BONUS_PER_POINT * commander.attack;
  for (const g of groups) {
    g.hp *= statMul;
    g.unitLife *= statMul;
    g.unitDefense *= statMul;
    g.unitAtk *= atkMul;
  }
}

function living(groups: LiveGroup[]): LiveGroup[] {
  return groups.filter((g) => g.count > 0 && g.hp > 0);
}

function combatLiving(groups: LiveGroup[]): LiveGroup[] {
  return living(groups).filter(
    (g) => g.isCombat && g.role !== "logistics" && g.role !== "scout",
  );
}

function onlyNonCombat(groups: LiveGroup[]): boolean {
  const liv = living(groups);
  return liv.length > 0 && combatLiving(groups).length === 0;
}

function rpsMul(
  atkRole: string,
  defRole: string,
  matrix: Record<string, Record<string, number>>,
): number {
  const m = matrix[atkRole]?.[defRole] ?? 1;
  // Amplify RPS edges so triangle matchups (M1–M3) resolve cleanly.
  if (m > 1) return 1 + (m - 1) * 1.8;
  if (m < 1) return Math.max(0.25, 1 - (1 - m) * 1.4);
  return m;
}

function threatScore(g: LiveGroup): number {
  return g.count * g.unitAtk * (g.isSovereign ? 3 : 1);
}

function pickTarget(
  attacker: LiveGroup,
  enemies: LiveGroup[],
  distance: (a: LiveGroup, b: LiveGroup) => number,
  rng: () => number,
): LiveGroup | null {
  const inRange = enemies.filter(
    (e) => distance(attacker, e) <= attacker.unitRange + 1e-6,
  );
  const pool = inRange.length > 0 ? inRange : [];
  if (pool.length === 0) return null;

  let scored: { g: LiveGroup; score: number }[] = [];
  for (const e of pool) {
    let score = 0;
    if (attacker.role === "speed") {
      if (e.role === "speed") score = 100 + threatScore(e);
      else if (e.role === "range") score = 80 + threatScore(e);
      else if (e.role === "melee") score = 40 + threatScore(e);
      else score = 20 + threatScore(e);
    } else if (attacker.role === "range") {
      // Prefer fastest threat in range, then highest DPS
      score = e.unitSpeed * 2 + threatScore(e);
    } else if (attacker.role === "melee") {
      if (e.role === "speed") score = 100 + threatScore(e);
      else score = 50 + threatScore(e);
    } else if (attacker.role === "sovereign") {
      score = threatScore(e) * 2;
    } else {
      score = threatScore(e);
    }
    // Prefer combat over logistics/scout
    if (e.role === "logistics" || e.role === "scout") score *= 0.2;
    score *= 0.95 + rng() * 0.1;
    scored.push({ g: e, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.g ?? null;
}

function powerScale(power: number): number {
  // Elite troops punch above raw atk×count; fluff cannot flood-win (M8).
  return Math.pow(Math.max(1, power), 0.55);
}

function groupDamage(g: LiveGroup): number {
  const eff = stackEfficiency(g.count);
  return g.count * g.unitAtk * eff * powerScale(g.unitPower);
}

function applyDamage(target: LiveGroup, dmg: number, fromPower = 1): void {
  if (dmg <= 0 || target.hp <= 0) return;
  // Quality gap: elites resist fluff better and carve fluff harder (M8).
  const resist = Math.pow(
    Math.max(1, target.unitPower) / Math.max(1, fromPower),
    0.45,
  );
  const mitigated = dmg / (1 + target.unitDefense * 0.02) / Math.max(0.25, resist);
  target.hp = Math.max(0, target.hp - mitigated);
  target.count = Math.max(0, Math.floor(target.hp / target.unitLife + 1e-9));
  if (target.hp > 0 && target.count === 0) target.count = 1;
  if (target.hp <= 0) {
    target.count = 0;
    target.hp = 0;
  }
}

function lossesFrom(groups: LiveGroup[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const g of groups) {
    const lost = g.startCount - g.count;
    if (lost > 0) {
      out[g.unitId] = (out[g.unitId] ?? 0) + lost;
    }
  }
  return out;
}

function remainingFrom(groups: LiveGroup[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const g of groups) {
    if (g.count > 0) {
      out[g.unitId] = (out[g.unitId] ?? 0) + g.count;
    }
  }
  return out;
}

function maxRange(groups: LiveGroup[]): number {
  let m = 0;
  for (const g of groups) {
    if (g.unitRange > m) m = g.unitRange;
  }
  return m;
}

/**
 * Resolve a battle deterministically from seed + inputs.
 */
export function resolveBattle(input: BattleInput): BattleResult {
  const formulas = getFormulas();
  const rps = getRps();
  const rng = mulberry32(input.seed >>> 0);
  const rngMin = formulas.rngMin ?? 0.85;
  const rngMax = formulas.rngMax ?? 1.0;
  const flat = formulas.openDistanceFlat ?? 250;

  const atkGroups = buildGroups(input.attacker, "attacker", 0);
  // Provisional open distance from attacker ranges
  const provisionalOpen =
    input.openDistanceOverride ?? maxRange(atkGroups) + flat;
  const defGroups = buildGroups(input.defender, "defender", provisionalOpen);
  const openDistance = provisionalOpen;

  // Commander leadership bonuses (spec §5) — after stat lookup, before rounds.
  applyCommanderBonus(atkGroups, input.attacker.commander);
  applyCommanderBonus(defGroups, input.defender.commander);

  // Edge: empty sides
  if (living(atkGroups).length === 0 && living(defGroups).length === 0) {
    return {
      rulesVersion: input.rulesVersion,
      seed: input.seed,
      winner: "draw",
      rounds: 0,
      openDistance,
      losses: { attacker: {}, defender: {} },
      remaining: { attacker: {}, defender: {} },
      note: "empty battle",
    };
  }

  const dist = (a: LiveGroup, b: LiveGroup) => Math.abs(a.pos - b.pos);

  let rounds = 0;
  while (rounds < MAX_ROUNDS) {
    const atkLive = living(atkGroups);
    const defLive = living(defGroups);

    if (atkLive.length === 0 || defLive.length === 0) break;

    // Non-combat only vs combat: combat side wins if only logistics/scout left opposing real troops
    const atkCombat = combatLiving(atkGroups);
    const defCombat = combatLiving(defGroups);
    if (atkCombat.length === 0 && defCombat.length > 0 && onlyNonCombat(atkGroups)) {
      // pure logistics/scout attackers get shredded quickly; continue damage
    }
    if (defCombat.length === 0 && atkCombat.length > 0 && onlyNonCombat(defGroups)) {
      // continue
    }
    if (atkCombat.length === 0 && defCombat.length === 0) {
      // mutual non-combat or wipe
      if (atkLive.length === 0 || defLive.length === 0) break;
    }

    rounds += 1;

    // Snapshot attackers so simultaneous damage
    type Shot = { from: LiveGroup; to: LiveGroup; dmg: number };
    const shots: Shot[] = [];

    const fireSide = (side: LiveGroup[], enemies: LiveGroup[]) => {
      for (const g of living(side)) {
        if (g.role === "logistics") {
          // logistics rarely fight; tiny chip only if nothing else
          if (combatLiving(side).length > 0) continue;
        }
        const target = pickTarget(g, living(enemies), dist, rng);
        if (!target) continue;
        const base = groupDamage(g);
        const mul = rpsMul(g.role, target.role, rps);
        const roll = rngMin + rng() * (rngMax - rngMin);
        const dmg = base * mul * roll;
        shots.push({ from: g, to: target, dmg });
      }
    };

    fireSide(atkGroups, defGroups);
    fireSide(defGroups, atkGroups);

    for (const s of shots) {
      applyDamage(s.to, s.dmg, s.from.unitPower);
    }

    // Advance toward nearest enemy (close distance)
    const moveSide = (side: LiveGroup[], enemies: LiveGroup[]) => {
      const el = living(enemies);
      if (el.length === 0) return;
      for (const g of living(side)) {
        // Find nearest enemy
        let nearest = el[0]!;
        let best = dist(g, nearest);
        for (const e of el) {
          const d = dist(g, e);
          if (d < best) {
            best = d;
            nearest = e;
          }
        }
        if (best <= g.unitRange) continue; // already in range
        // Move toward enemy; speed scales step size
        const step = Math.max(20, g.unitSpeed * 2.5);
        if (g.pos < nearest.pos) {
          g.pos = Math.min(nearest.pos, g.pos + step);
        } else {
          g.pos = Math.max(nearest.pos, g.pos - step);
        }
      }
    };

    moveSide(atkGroups, defGroups);
    moveSide(defGroups, atkGroups);

    // Early exit if one side wiped
    if (living(atkGroups).length === 0 || living(defGroups).length === 0) break;

    // If only non-combat remain on one side vs combat, give combat free focus a few rounds then break
    if (
      combatLiving(atkGroups).length === 0 &&
      combatLiving(defGroups).length > 0 &&
      living(atkGroups).length > 0
    ) {
      // already dealing damage; if after this round atk still only logistics, keep going
    }
  }

  const atkLeft = living(atkGroups);
  const defLeft = living(defGroups);
  const atkCombatLeft = combatLiving(atkGroups);
  const defCombatLeft = combatLiving(defGroups);

  let winner: "attacker" | "defender" | "draw";
  if (atkLeft.length === 0 && defLeft.length === 0) {
    winner = "draw";
  } else if (atkLeft.length === 0) {
    winner = "defender";
  } else if (defLeft.length === 0) {
    winner = "attacker";
  } else if (atkCombatLeft.length > 0 && defCombatLeft.length === 0) {
    winner = "attacker";
  } else if (defCombatLeft.length > 0 && atkCombatLeft.length === 0) {
    winner = "defender";
  } else {
    // HP / power remaining comparison
    const power = (gs: LiveGroup[]) =>
      living(gs).reduce((s, g) => s + g.hp * (1 + g.unitAtk * 0.01), 0);
    const ap = power(atkGroups);
    const dp = power(defGroups);
    if (ap > dp * 1.05) winner = "attacker";
    else if (dp > ap * 1.05) winner = "defender";
    else winner = "draw";
  }

  return {
    rulesVersion: input.rulesVersion,
    seed: input.seed,
    winner,
    rounds,
    openDistance,
    losses: {
      attacker: lossesFrom(atkGroups),
      defender: lossesFrom(defGroups),
    },
    remaining: {
      attacker: remainingFrom(atkGroups),
      defender: remainingFrom(defGroups),
    },
  };
}

/** Parse matchup strings like "5k Reefbow" or "3k Stormkeel + 2k Levy". */
export function parseForceString(spec: string): SideInput {
  const s = spec.trim();
  if (/^harbinger alone$/i.test(s)) {
    return { groups: [], sovereign: { sovereignId: "harbinger", level: 1 } };
  }
  if (/^harbinger \+/i.test(s)) {
    const rest = s.replace(/^harbinger \+/i, "").trim();
    const groups = parseForceString(rest).groups;
    return { groups, sovereign: { sovereignId: "harbinger", level: 1 } };
  }
  if (/^same$/i.test(s)) {
    return { groups: [] };
  }

  const parts = s.split(/\s*\+\s*/);
  const groups: BattleGroup[] = [];
  const nameToId: Record<string, string> = {
    // Medieval names
    levy: "levy",
    pikeman: "pikeman",
    man_at_arms: "man_at_arms",
    "man-at-arms": "man_at_arms",
    halberdier: "halberdier",
    bowman: "bowman",
    longbowman: "longbowman",
    crossbowman: "crossbowman",
    "heavy crossbowman": "heavy_crossbowman",
    heavy_crossbowman: "heavy_crossbowman",
    light_cavalry: "light_cavalry",
    "light cavalry": "light_cavalry",
    knight: "knight",
    shieldman: "shieldman",
    heavy_pikeman: "heavy_pikeman",
    "heavy pikeman": "heavy_pikeman",
    sapper: "sapper",
    porter: "porter",
    scout: "scout",
    supply_wagon: "supply_wagon",
    "supply wagon": "supply_wagon",
    mounted_scout: "mounted_scout",
    "mounted scout": "mounted_scout",
    // Legacy names (backward compat)
    tidepike: "pikeman",
    reefbow: "bowman",
    skyshrike: "light_cavalry",
    stormkeel: "knight",
    bullhorn: "man_at_arms",
    colossus: "halberdier",
    "colossus frame": "halberdier",
    sunmirror: "heavy_crossbowman",
    ironbarge: "supply_wagon",
    packwing: "mounted_scout",
    gulper: "shieldman",
    "coral lance": "crossbowman",
    rubbleback: "sapper",
    slabguard: "heavy_pikeman",
    bearer: "porter",
    whisper: "scout",
  };

  for (const part of parts) {
    const m = part.trim().match(/^(\d+(?:\.\d+)?)\s*k\s+(.+)$/i);
    if (!m) {
      const m2 = part.trim().match(/^(\d+)\s+(.+)$/i);
      if (!m2) continue;
      const count = Number(m2[1]);
      const name = m2[2]!.trim().toLowerCase();
      const id = nameToId[name];
      if (id) groups.push({ unitId: id, count });
      continue;
    }
    const count = Math.round(Number(m[1]) * 1000);
    const name = m[2]!.trim().toLowerCase();
    const id = nameToId[name];
    if (id) groups.push({ unitId: id, count });
  }
  return { groups };
}
