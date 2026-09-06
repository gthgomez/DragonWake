/**
 * Living dragon domain. DragonPresence remains an awareness projection;
 * individuals, relationships, knowledge, and world verbs live here.
 *
 * Vision Council Round 4 law (DRAGON_VISION_COUNCIL_V1.md):
 * - the Scar is an authored territory encounter, never a reskinned camp;
 * - knowledge advances on distinct evidence kinds, never counts;
 * - wounds are never caused by clicking a normal role;
 * - the pact costs something in the world (the yielded spawning bank);
 * - Ford/Blockade binds to the pre-existing Fen Crossing tile.
 */
import { randomUUID } from "node:crypto";
import type { BattleGroup } from "@dragonwake/combat";
import { getUnitById } from "@dragonwake/content";
import type { City, World } from "../world.js";
import {
  FEN_SILT,
  FEN_WYRM_ARCHETYPE,
  SIGNATURE_ARCHETYPE,
  VANE_READING,
  type ChronicleEvent,
  type DragonIndividual,
  type EvidenceKind,
  type HarnessRole,
  type KnowledgeEntry,
  type MapFeature,
  type WorldVerb,
} from "./types.js";

function fail(code: string, message: string): never {
  throw Object.assign(new Error(message), { code });
}

function dur(seconds: number, fast: boolean): number {
  return Math.max(50, (fast ? seconds / 60 : seconds) * 1000);
}

function putDragon(world: World, d: DragonIndividual): DragonIndividual {
  world.dragonIndividuals.set(d.id, d);
  world.dirty.dragons.add(d.id);
  return d;
}

function putKnowledge(world: World, k: KnowledgeEntry): KnowledgeEntry {
  const key = `${k.playerId}:${k.questionId}`;
  world.dragonKnowledge.set(key, k);
  world.dirty.dragonKnowledge.add(key);
  return k;
}

function putVerb(world: World, v: WorldVerb): WorldVerb {
  world.worldVerbs.set(v.id, v);
  world.dirty.worldVerbs.add(v.id);
  return v;
}

function putFeature(world: World, f: MapFeature): MapFeature {
  world.mapFeatures.set(f.id, f);
  world.dirty.mapFeatures.add(f.id);
  return f;
}

function addChronicle(world: World, dragonId: string, kind: string, summary: string): ChronicleEvent {
  const ev: ChronicleEvent = {
    id: randomUUID(),
    dragonId,
    at: world.now(),
    kind,
    summary,
  };
  const list = world.dragonChronicle.get(dragonId) ?? [];
  list.push(ev);
  world.dragonChronicle.set(dragonId, list);
  world.dirty.dragons.add(dragonId);
  return ev;
}

// ── Knowledge: evidence records, not counters (Round 4, Question B) ────────

function knowledgeOf(world: World, playerId: string, questionId: string): KnowledgeEntry {
  const key = `${playerId}:${questionId}`;
  return (
    world.dragonKnowledge.get(key) ?? {
      playerId,
      questionId,
      state: "rumored",
      evidence: [],
      provenAt: null,
    }
  );
}

/**
 * Record one observation. States advance on DISTINCT kinds with at least
 * one world-sourced record: rumored → observed on the first note, observed
 * → supported at two kinds including one from the world outside the
 * player's own holding. Same-kind repeats accumulate as notes and never
 * advance the state — duplicate observation farming is impossible.
 */
function recordEvidence(
  world: World,
  playerId: string,
  questionId: string,
  kind: EvidenceKind,
  source: string,
  summary: string,
  worldSourced: boolean,
): KnowledgeEntry {
  const k = knowledgeOf(world, playerId, questionId);
  k.evidence.push({ at: world.now(), kind, source, summary, worldSourced });
  if (k.state === "rumored") {
    k.state = "observed";
  } else if (k.state === "observed") {
    const kinds = new Set(k.evidence.map((e) => e.kind));
    const hasWorld = k.evidence.some((e) => e.worldSourced);
    if (kinds.size >= 2 && hasWorld) k.state = "supported";
  }
  return putKnowledge(world, k);
}

export function dragonsForPlayer(world: World, playerId: string): DragonIndividual[] {
  return [...world.dragonIndividuals.values()].filter((d) => d.ownerPlayerId === playerId);
}

export function signatureDragon(world: World, playerId: string): DragonIndividual | undefined {
  return dragonsForPlayer(world, playerId).find((d) => d.kind === "signature");
}

export function fenWyrmFor(world: World, playerId: string): DragonIndividual | undefined {
  return dragonsForPlayer(world, playerId).find((d) => d.archetypeId === FEN_WYRM_ARCHETYPE);
}

export function crossingFor(world: World, playerId: string): MapFeature | undefined {
  return [...world.mapFeatures.values()].find(
    (f) => f.kind === "fen_crossing" && f.ownerPlayerId === playerId,
  );
}

/** The crossing denies its tile to wilderness claims in every state. */
export function crossingAt(world: World, x: number, y: number): MapFeature | undefined {
  return [...world.mapFeatures.values()].find(
    (f) => f.kind === "fen_crossing" && f.x === x && f.y === y,
  );
}

export function clutchAvailable(world: World, playerId: string): boolean {
  const progress = world.dragonProgress.get(playerId);
  if (!progress?.charterEarned) return false;
  if (signatureDragon(world, playerId)) return false;
  return true;
}

export function nameHatchling(world: World, playerId: string, rawName: string): DragonIndividual {
  if (signatureDragon(world, playerId)) fail("HAS_HATCHLING", "you already named your hatchling");
  if (!world.dragonProgress.get(playerId)?.charterEarned) {
    fail("NO_CLUTCH", "the abandoned clutch is found only after surviving the Scar");
  }
  const name = rawName.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 24) fail("BAD_NAME", "choose a name of 2 to 24 letters");
  if (!/^[A-Za-z][A-Za-z '\-]*$/.test(name)) fail("BAD_NAME", "the name must be spoken letters");
  const capital = world.citiesForPlayer(playerId).find((c) => c.kind === "capital");
  if (!capital) fail("NO_CAPITAL", "no capital");
  const now = world.now();
  const d: DragonIndividual = {
    id: randomUUID(),
    realmId: world.realmId,
    ownerPlayerId: playerId,
    archetypeId: SIGNATURE_ARCHETYPE,
    kind: "signature",
    givenName: name,
    epithet: "Wake-clutch Vale Drake",
    origin: "Abandoned clutch on the Dragon Scar after the territorial adult fled.",
    homeCityId: capital.id,
    locationKind: "roost",
    locationX: capital.mapX,
    locationY: capital.mapY,
    lifeStage: "hatchling",
    physicalState: "healthy",
    woundId: null,
    woundUntil: null,
    temperament: "wary",
    harness: "none",
    harnessRole: "yard",
    relationship: "bonded",
    namedAt: now,
    discoveredAt: now,
    lastObservedAt: null,
    observeCount: 0,
  };
  putDragon(world, d);
  addChronicle(world, d.id, "named", `${name} was named at the Capital roost.`);
  // Seed the Vane Reading question only if the Scar evidence did not
  // already open it — naming must never wipe recorded field notes.
  if (!world.dragonKnowledge.has(`${playerId}:${VANE_READING}`)) {
    putKnowledge(world, {
      playerId,
      questionId: VANE_READING,
      state: "rumored",
      evidence: [],
      provenAt: null,
    });
  }
  world.pushEvent(playerId, "info", `${name} lives in the roost. This is your dragon.`, {
    kind: "hatchling_named",
    dragonId: d.id,
  });
  return d;
}

const ROOST_TELLS: Record<DragonIndividual["temperament"], string> = {
  wary: "Vanes lie flat at every footstep; it startles when the gate hinges squeal.",
  curious: "The vanes lifted toward the keeper before feeding.",
  loyal: "Vanes warmed at the named keeper's approach.",
  irritable: "Vanes spiked when the stall was crowded.",
};

export function observeDragon(world: World, playerId: string, dragonId: string): DragonIndividual {
  const d = world.dragonIndividuals.get(dragonId);
  if (!d || d.ownerPlayerId !== playerId) fail("NO_DRAGON", "that dragon is not yours to watch");
  d.observeCount += 1;
  d.lastObservedAt = world.now();
  if (d.kind === "signature" && d.temperament === "wary" && d.observeCount >= 2) {
    d.temperament = "curious";
    addChronicle(world, d.id, "temperament", `${d.givenName ?? "The hatchling"} grew curious of its keeper.`);
  }
  putDragon(world, d);
  if (d.archetypeId === SIGNATURE_ARCHETYPE) {
    recordEvidence(
      world,
      playerId,
      VANE_READING,
      "roost_behavior",
      "the roost",
      ROOST_TELLS[d.temperament],
      false,
    );
  } else {
    recordEvidence(
      world,
      playerId,
      FEN_SILT,
      "encounter",
      d.locationKind === "ford" ? "the crossing" : "the fen",
      "Where the wyrm surfaced, the water went thick with silt; a barge pole sank without a strike.",
      true,
    );
    if (d.relationship === "hostile" || d.relationship === "wild") {
      d.relationship = "observed";
      putDragon(world, d);
    }
  }
  addChronicle(world, d.id, "observed", "A keeper watched and recorded the living creature.");
  return d;
}

export function setHarness(world: World, playerId: string, dragonId: string, role: HarnessRole): DragonIndividual {
  const d = world.dragonIndividuals.get(dragonId);
  if (!d || d.ownerPlayerId !== playerId) fail("NO_DRAGON", "that dragon is not yours");
  if (d.kind !== "signature") fail("NO_HARNESS", "the Fen Wyrm will not take a stall harness");
  if (role === "home_guard") {
    if (d.lifeStage === "hatchling") {
      // Wounds are never caused by clicking a normal role (Round 4, Q C).
      fail("TOO_YOUNG", "it cannot leave the yard yet — a hatchling guards nothing");
    }
    if (d.physicalState !== "healthy") {
      fail("WOUNDED", "a wounded dragon cannot take Home Guard");
    }
    if (d.harness !== "guard_harness") {
      fail("NEED_HARNESS", "Home Guard needs a guard harness — craft one first");
    }
    d.harnessRole = "home_guard";
    d.locationKind = "approaches";
    addChronicle(world, d.id, "harness", `${d.givenName ?? "The dragon"} took Home Guard on the approaches. The roost stands empty.`);
  } else {
    const previous = d.harnessRole;
    d.harnessRole = "yard";
    d.locationKind = d.physicalState === "healthy" ? "roost" : "recovering";
    if (previous === "home_guard") {
      addChronicle(world, d.id, "harness", `${d.givenName ?? "The dragon"} returned to the Yard.`);
    }
  }
  putDragon(world, d);
  return d;
}

const GUARD_HARNESS_COST = { wood: 120, ore: 80, crownmark: 30 } as const;

/** Craft the Guard Harness: the act of preparation that unlocks Home Guard. */
export function craftGuardHarness(world: World, playerId: string): DragonIndividual {
  const d = signatureDragon(world, playerId);
  if (!d) fail("NO_DRAGON", "no dragon to fit");
  if (d.lifeStage === "hatchling") {
    fail("TOO_SMALL", "a hatchling is too small for any harness — let it grow first");
  }
  if (d.harness === "guard_harness") fail("HAS_HARNESS", "the guard harness is already fitted");
  if (d.physicalState !== "healthy") fail("WOUNDED", "fit nothing on a wounded dragon");
  const capital = world.citiesForPlayer(playerId).find((c) => c.kind === "capital");
  if (!capital) fail("NO_CAPITAL", "no capital");
  if ((capital.resources.wood ?? 0) < GUARD_HARNESS_COST.wood) {
    fail("NEED_MATERIALS", `the yard needs ${GUARD_HARNESS_COST.wood} wood for the harness`);
  }
  if ((capital.resources.ore ?? 0) < GUARD_HARNESS_COST.ore) {
    fail("NEED_MATERIALS", `the yard needs ${GUARD_HARNESS_COST.ore} ore for buckles and rings`);
  }
  if ((capital.resources.crownmark ?? 0) < GUARD_HARNESS_COST.crownmark) {
    fail("NEED_MATERIALS", `the tack-maker charges ${GUARD_HARNESS_COST.crownmark} crownmarks`);
  }
  capital.resources.wood -= GUARD_HARNESS_COST.wood;
  capital.resources.ore -= GUARD_HARNESS_COST.ore;
  capital.resources.crownmark -= GUARD_HARNESS_COST.crownmark;
  world.touchCity(capital);
  d.harness = "guard_harness";
  putDragon(world, d);
  addChronicle(world, d.id, "harness", `A guard harness, cut and fitted in the keep yard, hangs ready for ${d.givenName ?? "the dragon"}.`);
  world.pushEvent(
    playerId,
    "info",
    `The guard harness is fitted. ${d.givenName ?? "Your dragon"} can now take Home Guard.`,
    { kind: "harness_crafted", dragonId: d.id },
  );
  return d;
}

export function growHatchling(world: World, playerId: string, dragonId: string): DragonIndividual {
  const d = world.dragonIndividuals.get(dragonId);
  if (!d || d.ownerPlayerId !== playerId) fail("NO_DRAGON", "that dragon is not yours");
  if (d.kind !== "signature") fail("NO_GROWTH", "adult dragons do not grow on this axis");
  if (d.lifeStage !== "hatchling") fail("ALREADY_GROWN", "the first growth has already happened");
  if (!d.namedAt) fail("NOT_NAMED", "name the hatchling first");
  const waited = world.now() - d.namedAt;
  if (waited < dur(45, world.devFastTime)) fail("TOO_SOON", "growth needs time in the roost, not only a button");
  const vane = knowledgeOf(world, playerId, VANE_READING);
  if (vane.state !== "supported" && vane.state !== "proven") {
    fail(
      "NO_RESEARCH",
      "growth trusts a keeper who has read the vanes — support Vane Reading with distinct observations first",
    );
  }
  d.lifeStage = "wyrmling";
  if (d.temperament === "curious") d.temperament = "loyal";
  putDragon(world, d);
  addChronicle(world, d.id, "growth", `${d.givenName ?? "The dragon"} became a wyrmling — the keeper had read the vanes.`);
  world.pushEvent(playerId, "info", `${d.givenName ?? "Your dragon"} has grown into a wyrmling.`, {
    kind: "dragon_growth",
    dragonId: d.id,
  });
  return d;
}

export function codifyKnowledge(world: World, playerId: string, questionId: string): KnowledgeEntry {
  const k = knowledgeOf(world, playerId, questionId);
  if (k.state !== "supported" && k.state !== "proven") {
    fail("NOT_READY", "knowledge must be supported before it can be codified");
  }
  if (k.state !== "proven") {
    k.state = "proven";
    k.provenAt = world.now();
    putKnowledge(world, k);
    const dragon =
      questionId === VANE_READING
        ? signatureDragon(world, playerId)
        : fenWyrmFor(world, playerId);
    if (dragon) {
      addChronicle(
        world,
        dragon.id,
        "research",
        questionId === VANE_READING
          ? "Vane Reading was codified — keepers can now read temperament tells."
          : "Wet silt-pack was codified — ford signaling becomes possible.",
      );
    }
  }
  return k;
}

export function processDragonWounds(world: World, now: number): void {
  for (const d of world.dragonIndividuals.values()) {
    if (d.physicalState === "healthy") continue;
    if (d.woundUntil && d.woundUntil <= now) {
      d.physicalState = "healthy";
      d.woundId = null;
      d.woundUntil = null;
      d.locationKind = d.kind === "signature" ? "roost" : "home_waters";
      putDragon(world, d);
      addChronicle(world, d.id, "recovered", "The wound closed. Rest, not Chronite, did the work.");
      world.pushEvent(d.ownerPlayerId, "info", `${d.givenName ?? d.epithet} has recovered.`, {
        kind: "dragon_recovered",
        dragonId: d.id,
      });
    }
  }
}

// ── The Dragon Scar: one authored territory encounter (Round 4, Q A) ──────
//
// The dragon is NOT a unit in either line. Three authored behaviors punish
// specific compositions; the company's losses — never the dragon's health —
// decide the outcome. The adult always breaks off: victory is survival.

type EncounterPhase = {
  behavior: "wing_rush" | "vane_dive" | "breaking_pressure";
  summary: string;
  losses: Record<string, number>;
};

export type EncounterResolution = {
  outcome: "survived" | "driven_back" | "routed";
  committed: Record<string, number>;
  remaining: Record<string, number>;
  phases: EncounterPhase[];
};

/** Spears and braced polearms hold a line against a wing rush. */
const ANCHOR_UNITS = new Set(["levy", "pikeman", "shieldman", "halberdier", "dragon_slayer"]);
/** Loose, fast, or burdened creatures that scatter when the sky falls. */
const LOOSE_UNITS = new Set([
  "scout",
  "mounted_scout",
  "light_cavalry",
  "knight",
  "warhound",
  "porter",
  "supply_wagon",
]);

function lossesFor(groups: Record<string, number>, ids: string[], rate: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of ids) {
    const count = groups[id] ?? 0;
    if (count <= 0) continue;
    out[id] = Math.min(count, Math.round(count * rate));
  }
  return out;
}

function applyLosses(groups: Record<string, number>, losses: Record<string, number>): void {
  for (const [id, lost] of Object.entries(losses)) {
    groups[id] = (groups[id] ?? 0) - lost;
    if (groups[id] <= 0) delete groups[id];
  }
}

function sumCounts(groups: Record<string, number>): number {
  return Object.values(groups).reduce((a, b) => a + b, 0);
}

function unitRole(unitId: string): string {
  return getUnitById(unitId)?.role ?? "melee";
}

/** Authored three-beat territory fight. Pure so tests can pin the truth table. */
export function scoreTerritoryEncounter(
  composition: Record<string, number>,
): EncounterResolution {
  const committed: Record<string, number> = {};
  for (const [unitId, count] of Object.entries(composition)) {
    const n = Math.floor(Number(count) || 0);
    if (n > 0) committed[unitId] = n;
  }
  const total = sumCounts(committed);
  if (total === 0) {
    fail("NO_TROOPS", "send an army to the Scar");
  }

  const ids = Object.keys(committed);
  const meleeIds = ids.filter((id) => unitRole(id) === "melee");
  const missileIds = ids.filter((id) => unitRole(id) === "range");
  const looseIds = ids.filter((id) => LOOSE_UNITS.has(id));
  const anchorIds = ids.filter((id) => ANCHOR_UNITS.has(id));

  const groups: Record<string, number> = { ...committed };
  const phases: EncounterPhase[] = [];

  // Beat 1 — Wing Rush: punishes dense melee columns that did not anchor.
  const meleeMass = meleeIds.reduce((a, id) => a + groups[id]!, 0);
  const anchorMass = anchorIds.reduce((a, id) => a + groups[id]!, 0);
  const anchored = meleeMass === 0 || anchorMass * 2 >= meleeMass;
  const rushLosses = {
    ...lossesFor(groups, anchored ? [] : meleeIds, 0.35),
    ...lossesFor(groups, looseIds, 0.3),
  };
  applyLosses(groups, rushLosses);
  phases.push({
    behavior: "wing_rush",
    summary: anchored
      ? "Wing Rush — the stoop broke over anchored spears; the column did not break."
      : `Wing Rush — the adult fell on a dense, unanchored column and scattered it.`,
    losses: rushLosses,
  });

  // Beat 2 — Vane Dive: punishes uncovered missile lines.
  const missileRemaining = missileIds.reduce((a, id) => a + (groups[id] ?? 0), 0);
  const anchorRemaining = anchorIds.reduce((a, id) => a + (groups[id] ?? 0), 0);
  const covered = anchorRemaining * 2 >= missileRemaining;
  const diveLosses = missileRemaining > 0
    ? lossesFor(groups, missileIds, covered ? 0.1 : 0.4)
    : {};
  applyLosses(groups, diveLosses);
  phases.push({
    behavior: "vane_dive",
    summary:
      missileRemaining === 0
        ? "Vane Dive — the vane-sail snapped upright and dropped through empty air; no bow line stood to be punished."
        : covered
          ? "Vane Dive — the dive came and the braced line caught it; the bowmen held."
          : "Vane Dive — the dive tore an uncovered bow line to ribbons.",
    losses: diveLosses,
  });

  // Beat 3 — Breaking Pressure: the adult lands and pushes the line itself.
  const meleeRemaining = meleeIds.reduce((a, id) => a + (groups[id] ?? 0), 0);
  const missileAfterDive = missileIds.reduce((a, id) => a + (groups[id] ?? 0), 0);
  const lineMass = meleeRemaining + missileAfterDive;
  const anchorShare = lineMass > 0 ? anchorRemaining / lineMass : 1;
  const broke = anchorShare < 0.3;
  const pressLosses = lossesFor(groups, Object.keys(groups), broke ? 0.55 : 0.12);
  applyLosses(groups, pressLosses);
  phases.push({
    behavior: "breaking_pressure",
    summary: broke
      ? "Breaking Pressure — the line bent, then broke; the adult rolled through the middle of it."
      : "Breaking Pressure — shields locked, spears set; the adult tested the line and broke off.",
    losses: pressLosses,
  });

  const remainingTotal = sumCounts(groups);
  const lossRatio = total - remainingTotal === 0 ? 0 : (total - remainingTotal) / total;
  const outcome: EncounterResolution["outcome"] =
    lossRatio <= 0.34 ? "survived" : lossRatio <= 0.66 ? "driven_back" : "routed";

  return { outcome, committed, remaining: groups, phases };
}

/**
 * The real Scar: survive the territorial adult's three beats. The player
 * never kills the adult — outcome turns on what the company endured, and
 * the report names which behavior punished which choice.
 */
export function resolveDragonTerritoryEncounter(
  world: World,
  playerId: string,
  composition: Record<string, number>,
): { outcome: EncounterResolution["outcome"]; reportId: string; charterEarned: boolean } {
  const progress = world.dragonProgress.get(playerId);
  if (!progress || progress.expeditionStage !== 4) {
    fail("ENCOUNTER_LOCKED", "the Scar encounter is the last expedition stage");
  }
  const capital = world.citiesForPlayer(playerId).find((c) => c.kind === "capital");
  if (!capital) fail("NO_CAPITAL", "no capital");

  const groups: BattleGroup[] = [];
  for (const [unitId, count] of Object.entries(composition)) {
    const n = Math.floor(Number(count) || 0);
    if (n <= 0) continue;
    if ((capital.stacks[unitId] ?? 0) < n) fail("NO_TROOPS", `not enough ${unitId}`);
    groups.push({ unitId, count: n });
  }
  if (groups.length === 0) fail("NO_TROOPS", "send an army to the Scar");
  const committed: Record<string, number> = Object.fromEntries(
    groups.map((g) => [g.unitId, g.count]),
  );
  for (const g of groups) {
    capital.stacks[g.unitId] = (capital.stacks[g.unitId] ?? 0) - g.count;
  }

  const resolution = scoreTerritoryEncounter(committed);
  for (const [unitId, count] of Object.entries(resolution.remaining)) {
    capital.stacks[unitId] = (capital.stacks[unitId] ?? 0) + count;
  }
  world.touchCity(capital);

  const report = world.recordStandaloneReport(playerId, {
    kind: "dragon_scar_encounter",
    type: "dragon_encounter",
    outcome: resolution.outcome,
    behaviors: resolution.phases.map((p) => ({
      behavior: p.behavior,
      summary: p.summary,
      losses: p.losses,
    })),
    committed: resolution.committed,
    remaining: resolution.remaining,
    note:
      "Dragon Scar encounter — one authored territorial fight with a living adult. The dragon was never a unit in the line, and it always breaks off: the ground decided who held.",
  });

  world.updateBestiary(playerId, "valley_drake", 3);
  recordEvidence(
    world,
    playerId,
    VANE_READING,
    "encounter",
    "the Scar",
    "At the Scar the great vanes snapped upright a breath before the wing rush — remember that tell.",
    true,
  );

  if (resolution.outcome === "survived") {
    progress.expeditionStage = 0;
    progress.charterEarned = true;
    world.touchDragonProgress(playerId, progress);
    world.pushEvent(
      playerId,
      "info",
      "You held the clutch ground. The great drake broke off and flew east over the Marches — it is still out there. An abandoned clutch remains.",
      { kind: "scar_survived", reportId: report.id },
    );
    return { outcome: resolution.outcome, reportId: report.id, charterEarned: true };
  }

  if (resolution.outcome === "driven_back") {
    world.pushEvent(
      playerId,
      "info",
      "Driven back in order — the adult still holds the clutch ground. Read the report: anchor the line and cover the bowmen, then return.",
      { kind: "scar_driven_back", reportId: report.id },
    );
  } else {
    world.pushEvent(
      playerId,
      "info",
      "Routed. The company scattered into the waste. Regather what remains before you think of returning.",
      { kind: "scar_routed", reportId: report.id },
    );
  }
  return { outcome: resolution.outcome, reportId: report.id, charterEarned: false };
}

/** Stage-3 field note: the tell observed from the ridge, before any fight. */
export function recordScarScoutingEvidence(world: World, playerId: string): void {
  recordEvidence(
    world,
    playerId,
    VANE_READING,
    "scouting",
    "the Scar ridge",
    "From the ridge the watchers saw the great vane-sail snap upright a breath before it dropped on the herd.",
    true,
  );
}

// ── The Fen Crossing: the world cost of the pact (Round 4, Q D) ────────────

export function ensureFenRivalry(world: World, playerId: string): DragonIndividual {
  const existing = fenWyrmFor(world, playerId);
  if (existing) return existing;
  if (!signatureDragon(world, playerId)) fail("NO_HATCHLING", "the river problem appears after you have a hatchling");
  const marcher = world.citiesForPlayer(playerId).find((c) => c.kind === "marcher_keep");
  const home = marcher ?? world.citiesForPlayer(playerId).find((c) => c.kind === "capital");
  if (!home) fail("NO_CAPITAL", "no settlement");
  const tile = adjacentOpen(world, home);
  const d: DragonIndividual = {
    id: randomUUID(),
    realmId: world.realmId,
    ownerPlayerId: playerId,
    archetypeId: FEN_WYRM_ARCHETYPE,
    kind: "domain",
    givenName: null,
    epithet: "the Fen Wyrm of the local coils",
    origin: "An adult territorial wyrm already holding the river that the frontier needs.",
    homeCityId: null,
    locationKind: "home_waters",
    locationX: tile.x,
    locationY: tile.y,
    lifeStage: "mature",
    physicalState: "healthy",
    woundId: null,
    woundUntil: null,
    temperament: "irritable",
    harness: "none",
    harnessRole: "yard",
    relationship: "hostile",
    namedAt: null,
    discoveredAt: world.now(),
    lastObservedAt: null,
    observeCount: 0,
  };
  putDragon(world, d);
  addChronicle(world, d.id, "sighted", "A mature Fen Wyrm denied a ford on the frontier river.");
  if (!crossingFor(world, playerId)) {
    putFeature(world, {
      id: randomUUID(),
      kind: "fen_crossing",
      ownerPlayerId: playerId,
      x: tile.x,
      y: tile.y,
      state: "contested",
      surveyedAt: null,
      yieldedAt: null,
    });
  }
  putKnowledge(world, {
    playerId,
    questionId: FEN_SILT,
    state: "rumored",
    evidence: [],
    provenAt: null,
  });
  world.pushEvent(
    playerId,
    "info",
    "The river does not want a city. A mature Fen Wyrm holds the Fen Crossing.",
    { kind: "fen_rivalry", dragonId: d.id },
  );
  return d;
}

function adjacentOpen(world: World, city: City): { x: number; y: number } {
  const deltas = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, -1],
  ];
  for (const [dx, dy] of deltas) {
    const x = city.mapX + dx;
    const y = city.mapY + dy;
    if (x < 0 || y < 0 || x >= 40 || y >= 40) continue;
    const occupied = [...world.cities.values()].some((c) => c.mapX === x && c.mapY === y);
    if (!occupied) return { x, y };
  }
  return { x: Math.min(39, city.mapX + 1), y: city.mapY };
}

/** Read the contested crossing: world-sourced scouting evidence of the silt. */
export function surveyFenCrossing(world: World, playerId: string): {
  feature: MapFeature;
  knowledge: KnowledgeEntry;
} {
  const feature = crossingFor(world, playerId);
  if (!feature) fail("NO_CROSSING", "no crossing is known to you yet");
  const knowledge = recordEvidence(
    world,
    playerId,
    FEN_SILT,
    "scouting",
    "the Fen Crossing",
    "The crossing mud holds coil-marks the size of overturned barges; silt boils where it feeds, and shafts loosed in flood fell dead and short.",
    true,
  );
  feature.surveyedAt = world.now();
  putFeature(world, feature);
  world.pushEvent(playerId, "info", "The Fen Crossing was surveyed. The silt tells its story to a patient keeper.", {
    kind: "crossing_surveyed",
  });
  return { feature, knowledge };
}

/** Yield the spawning bank: the permanent world cost that opens the pact. */
export function yieldSpawningBank(world: World, playerId: string): MapFeature {
  const feature = crossingFor(world, playerId);
  if (!feature) fail("NO_CROSSING", "no crossing is known to you yet");
  if (feature.state === "sanctuary") fail("ALREADY_SANCTUARY", "the bank already lies under sanctuary terms");
  const silt = knowledgeOf(world, playerId, FEN_SILT);
  if (silt.state !== "supported" && silt.state !== "proven") {
    fail("NO_RESEARCH", "learn why the wyrm holds the bank before you yield it");
  }
  feature.state = "sanctuary";
  feature.yieldedAt = world.now();
  putFeature(world, feature);
  const fen = fenWyrmFor(world, playerId);
  if (fen) {
    addChronicle(world, fen.id, "yield", "The keeper yielded the spawning bank. The crossing is sanctuary ground; the coils keep it.");
  }
  world.pushEvent(
    playerId,
    "info",
    "The spawning bank stays unworked, from this season on. The Fen Crossing lies under sanctuary terms.",
    { kind: "spawning_bank_yielded" },
  );
  return feature;
}

export function pactFenWyrm(world: World, playerId: string): { dragon: DragonIndividual; city: City; verb: WorldVerb } {
  const d = fenWyrmFor(world, playerId) ?? ensureFenRivalry(world, playerId);
  if (d.relationship === "pacted") fail("ALREADY_PACTED", "the pact already stands");
  if (d.observeCount < 1) fail("NO_OBSERVE", "observe the Fen Wyrm before negotiating");
  const silt = knowledgeOf(world, playerId, FEN_SILT);
  if (silt.state !== "proven") {
    fail("NO_SIGNALING", "ford signaling is not codified — you cannot offer terms the wyrm can read");
  }
  const feature = crossingFor(world, playerId);
  if (!feature || feature.state !== "sanctuary") {
    fail("NO_SANCTUARY", "the wyrm will not treat while the crossing is contested — yield the spawning bank first");
  }
  const marcher = world.citiesForPlayer(playerId).some((c) => c.kind === "marcher_keep");
  if (!marcher) fail("NO_MARCHER", "the river pact follows the human frontier keep");
  let brine = world.citiesForPlayer(playerId).find((c) => c.kind === "brinehold");
  if (!brine) {
    brine = world.foundCitadel(playerId, "brinehold", "Brinehold", { skipUnlockCheck: true });
  }
  d.relationship = "pacted";
  d.homeCityId = brine.id;
  d.locationKind = "home_waters";
  d.locationX = brine.mapX;
  d.locationY = brine.mapY;
  d.lifeStage = "mature";
  putDragon(world, d);
  addChronicle(world, d.id, "pact", "A territorial pact under sanctuary terms: the spawning bank stays unworked; the wyrm keeps the crossing and grants the ford.");
  const verb: WorldVerb = {
    id: randomUUID(),
    dragonId: d.id,
    ownerPlayerId: playerId,
    verb: "ford_blockade",
    tileX: feature.x,
    tileY: feature.y,
    brineholdCityId: brine.id,
    stationed: false,
    terms: "spawning_bank_yielded",
  };
  putVerb(world, verb);
  recordEvidence(world, playerId, FEN_SILT, "battle_report", "the pact-stone", "Terms were struck at the pact-stone: the bank for the ford.", false);
  world.pushEvent(
    playerId,
    "info",
    "The Fen Wyrm accepted the pact under sanctuary terms. Brinehold stands as a river holding. The wyrm is not a pet.",
    { kind: "fen_pact", dragonId: d.id, cityId: brine.id },
  );
  return { dragon: d, city: brine, verb };
}

export function stationFenWyrm(world: World, playerId: string, where: "ford" | "home"): DragonIndividual {
  const d = fenWyrmFor(world, playerId);
  if (!d || d.relationship !== "pacted") fail("NO_PACT", "there is no pact to station");
  const verb = [...world.worldVerbs.values()].find((v) => v.dragonId === d.id);
  if (!verb) fail("NO_VERB", "no ford is bound to this wyrm");
  if (where === "ford") {
    d.locationKind = "ford";
    d.locationX = verb.tileX;
    d.locationY = verb.tileY;
    verb.stationed = true;
    addChronicle(world, d.id, "away", "The Fen Wyrm left home waters and coiled at the crossing.");
    world.pushEvent(playerId, "info", "The Fen Wyrm has left Brinehold for the crossing. The holding's home waters are unguarded.", {
      kind: "dragon_away",
      dragonId: d.id,
    });
  } else {
    const brine = world.cities.get(verb.brineholdCityId);
    d.locationKind = "home_waters";
    d.locationX = brine?.mapX ?? d.locationX;
    d.locationY = brine?.mapY ?? d.locationY;
    verb.stationed = false;
    addChronicle(world, d.id, "home", "The Fen Wyrm returned to home waters. The crossing is an ordinary ford again.");
    world.pushEvent(playerId, "info", "The Fen Wyrm returned to Brinehold's home waters. The blockade lifts.", {
      kind: "dragon_home",
      dragonId: d.id,
    });
  }
  putDragon(world, d);
  putVerb(world, verb);
  return d;
}

export function marchTravelFactor(world: World, playerId: string, fromCity: City, target: { type: string; playerId?: string; kind?: string; x: number; y: number }, intent: string): number {
  let factor = 1;
  for (const v of world.worldVerbs.values()) {
    if (!v.stationed) continue;
    const wyrm = world.dragonIndividuals.get(v.dragonId);
    if (!wyrm || wyrm.locationKind !== "ford") continue;
    const toBrine =
      (target.kind === "brinehold" || (target.x === v.tileX && target.y === v.tileY));
    const fromBrine = fromCity.kind === "brinehold" || fromCity.id === v.brineholdCityId;
    if (v.ownerPlayerId === playerId && (toBrine || fromBrine)) {
      factor *= 0.7;
    }
    if (v.ownerPlayerId !== playerId && intent === "attack" && toBrine) {
      factor *= 1.8;
    }
  }
  return factor;
}

export function scoutDragonIntel(world: World, targetPlayerId: string, cityKind: string): Record<string, unknown> | null {
  if (cityKind === "capital") {
    const sig = signatureDragon(world, targetPlayerId);
    if (!sig) return null;
    if (sig.locationKind === "approaches") {
      // Counter-scouting (Home Guard): hide detail, never lie. The roost is
      // in fact empty — the scouts simply cannot confirm it.
      return {
        kind: "signature",
        name: sig.givenName,
        location: "approaches",
        summary: `${sig.givenName} is posted on the approaches — a keeper's presence dogs every line, and the state of the roost could not be confirmed.`,
        roostEmpty: null,
        confidence: "degraded",
      };
    }
    return {
      kind: "signature",
      name: sig.givenName,
      location: sig.locationKind,
      summary: `${sig.givenName} is in the Capital roost.`,
      roostEmpty: false,
    };
  }
  if (cityKind === "brinehold") {
    const fen = fenWyrmFor(world, targetPlayerId);
    if (!fen || fen.relationship !== "pacted") return null;
    const away = fen.locationKind === "ford";
    return {
      kind: "fen_wyrm",
      epithet: fen.epithet,
      location: fen.locationKind,
      summary: away
        ? "The Fen Wyrm is away from Brinehold — coiled at the crossing."
        : "The Fen Wyrm is in the home waters at Brinehold.",
      away,
      raidWindow: away,
    };
  }
  return null;
}

export function livingPublic(world: World, playerId: string) {
  const dragons = dragonsForPlayer(world, playerId).map((d) => ({
    ...d,
    chronicle: world.dragonChronicle.get(d.id) ?? [],
    roostEmpty: d.kind === "signature" && d.locationKind !== "roost" && d.locationKind !== "recovering",
    vaneTells:
      knowledgeOf(world, playerId, VANE_READING).state === "proven" && d.kind === "signature"
        ? temperamentTell(d.temperament)
        : null,
  }));
  const knowledge = [...world.dragonKnowledge.values()]
    .filter((k) => k.playerId === playerId)
    .map((k) => ({
      questionId: k.questionId,
      state: k.state,
      provenAt: k.provenAt,
      // Field notes, not a checklist: what was seen, where, and how.
      notes: k.evidence.map((e) => ({
        kind: e.kind,
        source: e.source,
        summary: e.summary,
        at: e.at,
      })),
    }));
  const verbs = [...world.worldVerbs.values()].filter((v) => v.ownerPlayerId === playerId);
  const crossings = [...world.mapFeatures.values()].filter((f) => f.ownerPlayerId === playerId);
  return {
    clutchAvailable: clutchAvailable(world, playerId),
    fenRivalryAvailable: Boolean(signatureDragon(world, playerId)) && !fenWyrmFor(world, playerId),
    dragons,
    knowledge,
    verbs,
    crossings,
  };
}

function temperamentTell(t: DragonIndividual["temperament"]): string {
  switch (t) {
    case "wary":
      return "Vanes lie flat. It startles at engines.";
    case "curious":
      return "Vanes lift toward keepers. It watches the yard.";
    case "loyal":
      return "Vanes warm when the named keeper is near.";
    case "irritable":
      return "Vanes spike. Do not crowd the stall.";
  }
}

export function unitDisplayName(unitId: string, cityKind: string | undefined): string {
  if (cityKind === "brinehold") {
    if (unitId === "shieldman") return "Reedwarden";
    if (unitId === "crossbowman") return "Ford Arbalest";
  }
  return getUnitById(unitId)?.name ?? unitId;
}

export function floodedAttackerGroups(groups: BattleGroup[], defendingBrinehold: boolean): BattleGroup[] {
  if (!defendingBrinehold) return groups;
  return groups.map((g) => {
    const unit = getUnitById(g.unitId);
    if (unit?.role === "speed") {
      return { ...g, count: Math.max(1, Math.floor(g.count * 0.5)) };
    }
    return g;
  });
}
