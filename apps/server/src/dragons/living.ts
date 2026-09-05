/**
 * Living dragon domain. DragonPresence remains an awareness projection;
 * individuals, relationships, knowledge, and world verbs live here.
 */
import { randomUUID } from "node:crypto";
import { resolveBattle, COMBAT_RULES_VERSION, type BattleGroup } from "@dragonwake/combat";
import { getUnitById } from "@dragonwake/content";
import type { City, World } from "../world.js";
import {
  FEN_SILT,
  FEN_WYRM_ARCHETYPE,
  SIGNATURE_ARCHETYPE,
  VANE_READING,
  WOUND_STRAINED_VANE,
  type ChronicleEvent,
  type DragonIndividual,
  type HarnessRole,
  type KnowledgeEntry,
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

function knowledgeOf(world: World, playerId: string, questionId: string): KnowledgeEntry {
  const key = `${playerId}:${questionId}`;
  return (
    world.dragonKnowledge.get(key) ?? {
      playerId,
      questionId,
      state: "rumored",
      evidenceCount: 0,
      lastSource: "none",
      provenAt: null,
    }
  );
}

function bumpKnowledge(
  world: World,
  playerId: string,
  questionId: string,
  source: string,
): KnowledgeEntry {
  const k = knowledgeOf(world, playerId, questionId);
  if (k.state === "proven") {
    k.evidenceCount += 1;
    k.lastSource = source;
    return putKnowledge(world, k);
  }
  k.evidenceCount += 1;
  k.lastSource = source;
  if (k.state === "rumored" && k.evidenceCount >= 1) k.state = "observed";
  else if (k.state === "observed" && k.evidenceCount >= 2) k.state = "supported";
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
    harnessRole: "yard",
    relationship: "bonded",
    namedAt: now,
    discoveredAt: now,
    lastObservedAt: null,
    observeCount: 0,
  };
  putDragon(world, d);
  addChronicle(world, d.id, "named", `${name} was named at the Capital roost.`);
  putKnowledge(world, {
    playerId,
    questionId: VANE_READING,
    state: "rumored",
    evidenceCount: 0,
    lastSource: "naming",
    provenAt: null,
  });
  world.pushEvent(playerId, "info", `${name} lives in the roost. This is your dragon.`, {
    kind: "hatchling_named",
    dragonId: d.id,
  });
  return d;
}

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
    bumpKnowledge(world, playerId, VANE_READING, "roost");
  } else {
    bumpKnowledge(world, playerId, FEN_SILT, "observation");
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
  if (d.physicalState !== "healthy" && role === "home_guard") {
    fail("WOUNDED", "a wounded dragon cannot take Home Guard");
  }
  const previous = d.harnessRole;
  d.harnessRole = role;
  if (role === "home_guard") {
    d.locationKind = "approaches";
    if (d.lifeStage === "hatchling") {
      d.physicalState = "wounded";
      d.woundId = WOUND_STRAINED_VANE;
      d.woundUntil = world.now() + dur(120, world.devFastTime);
      d.locationKind = "recovering";
      d.harnessRole = "yard";
      addChronicle(
        world,
        d.id,
        "wound",
        "Strained vane — Home Guard was asked of a hatchling. The roost must rest it.",
      );
      world.pushEvent(playerId, "info", `${d.givenName ?? "Your dragon"} strained a vane. It cannot leave the roost until it recovers.`, {
        kind: "dragon_wound",
        dragonId: d.id,
      });
    } else {
      addChronicle(world, d.id, "harness", `${d.givenName ?? "The dragon"} took Home Guard on the approaches. The roost stands empty.`);
    }
  } else {
    d.locationKind = d.physicalState === "healthy" ? "roost" : "recovering";
    if (previous === "home_guard") {
      addChronicle(world, d.id, "harness", `${d.givenName ?? "The dragon"} returned to the Yard.`);
    }
  }
  putDragon(world, d);
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
  if (d.observeCount < 1) fail("NO_OBSERVE", "watch the hatchling before it will grow");
  const vane = knowledgeOf(world, playerId, VANE_READING);
  if (vane.state === "rumored") fail("NO_RESEARCH", "Vane Reading must at least be observed");
  d.lifeStage = "wyrmling";
  if (d.temperament === "curious") d.temperament = "loyal";
  putDragon(world, d);
  addChronicle(world, d.id, "growth", `${d.givenName ?? "The dragon"} became a wyrmling.`);
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

const SCAR_DEFENDERS: BattleGroup[] = [
  { unitId: "levy", count: 16 },
  { unitId: "scout", count: 4 },
];

export function resolveScarEncounter(
  world: World,
  playerId: string,
  composition: Record<string, number>,
): { winner: string; reportId: string; charterEarned: boolean } {
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
  for (const g of groups) {
    capital.stacks[g.unitId] = (capital.stacks[g.unitId] ?? 0) - g.count;
  }

  const result = resolveBattle({
    rulesVersion: COMBAT_RULES_VERSION,
    seed: (world.now() ^ playerId.length) >>> 0,
    attacker: { groups },
    defender: { groups: SCAR_DEFENDERS },
  });
  result.note =
    "Dragon Scar encounter — a territorial adult drove across the clutch ground. This is not a camp fight.";

  for (const g of groups) {
    const remain = result.remaining.attacker[g.unitId] ?? 0;
    capital.stacks[g.unitId] = (capital.stacks[g.unitId] ?? 0) + remain;
  }
  world.touchCity(capital);

  const report = world.recordStandaloneReport(playerId, {
    kind: "dragon_scar_encounter",
    type: "dragon_encounter",
    winner: result.winner,
    battle: result,
  });

  world.updateBestiary(playerId, "valley_drake", 3);
  bumpKnowledge(world, playerId, VANE_READING, "scar_encounter");

  if (result.winner === "attacker") {
    progress.expeditionStage = 0;
    progress.charterEarned = true;
    world.touchDragonProgress(playerId, progress);
    world.pushEvent(
      playerId,
      "info",
      "You survived the Scar. The territorial adult is gone. An abandoned clutch remains.",
      { kind: "scar_survived", reportId: report.id },
    );
    return { winner: result.winner, reportId: report.id, charterEarned: true };
  }

  world.pushEvent(
    playerId,
    "info",
    "The Scar drove you back. The adult still holds the clutch ground. Learn from the report and return.",
    { kind: "scar_defeat", reportId: report.id },
  );
  return { winner: result.winner, reportId: report.id, charterEarned: false };
}

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
    harnessRole: "yard",
    relationship: "hostile",
    namedAt: null,
    discoveredAt: world.now(),
    lastObservedAt: null,
    observeCount: 0,
  };
  putDragon(world, d);
  addChronicle(world, d.id, "sighted", "A mature Fen Wyrm denied a ford on the frontier river.");
  putKnowledge(world, {
    playerId,
    questionId: FEN_SILT,
    state: "rumored",
    evidenceCount: 0,
    lastSource: "flood",
    provenAt: null,
  });
  world.pushEvent(
    playerId,
    "info",
    "The river does not want a city. A mature Fen Wyrm holds the ford.",
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

export function pactFenWyrm(world: World, playerId: string): { dragon: DragonIndividual; city: City; verb: WorldVerb } {
  const d = fenWyrmFor(world, playerId) ?? ensureFenRivalry(world, playerId);
  if (d.relationship === "pacted") fail("ALREADY_PACTED", "the pact already stands");
  if (d.observeCount < 1) fail("NO_OBSERVE", "observe the Fen Wyrm before negotiating");
  const silt = knowledgeOf(world, playerId, FEN_SILT);
  if (silt.state === "rumored") fail("NO_RESEARCH", "learn why arrows fail on wet silt before you bargain");
  const marcher = world.citiesForPlayer(playerId).some((c) => c.kind === "marcher_keep");
  if (!marcher) fail("NO_MARCHER", "the river pact follows the human frontier keep");
  let brine = world.citiesForPlayer(playerId).find((c) => c.kind === "brinehold");
  if (!brine) {
    brine = world.foundCitadel(playerId, "brinehold", "Brinehold", { skipUnlockCheck: true });
  }
  const ford = adjacentOpen(world, brine);
  d.relationship = "pacted";
  d.homeCityId = brine.id;
  d.locationKind = "home_waters";
  d.locationX = brine.mapX;
  d.locationY = brine.mapY;
  d.lifeStage = "mature";
  putDragon(world, d);
  addChronicle(world, d.id, "pact", "A territorial pact: the spawning ground stays unworked; the holding may use the ford.");
  const verb: WorldVerb = {
    id: randomUUID(),
    dragonId: d.id,
    ownerPlayerId: playerId,
    verb: "ford_blockade",
    tileX: ford.x,
    tileY: ford.y,
    brineholdCityId: brine.id,
    stationed: false,
  };
  putVerb(world, verb);
  bumpKnowledge(world, playerId, FEN_SILT, "pact");
  world.pushEvent(
    playerId,
    "info",
    "The Fen Wyrm accepted a pact. Brinehold stands as a river holding. The wyrm is not a pet.",
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
    addChronicle(world, d.id, "away", "The Fen Wyrm left home waters and coiled at the ford.");
    world.pushEvent(playerId, "info", "The Fen Wyrm has left Brinehold for the ford. The holding's home waters are unguarded.", {
      kind: "dragon_away",
      dragonId: d.id,
    });
  } else {
    const brine = world.cities.get(verb.brineholdCityId);
    d.locationKind = "home_waters";
    d.locationX = brine?.mapX ?? d.locationX;
    d.locationY = brine?.mapY ?? d.locationY;
    verb.stationed = false;
    addChronicle(world, d.id, "home", "The Fen Wyrm returned to home waters. The ford is ordinary again.");
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
    const away = sig.locationKind === "approaches";
    return {
      kind: "signature",
      name: sig.givenName,
      location: sig.locationKind,
      summary: away
        ? `${sig.givenName} is on the approaches. The Capital roost is empty.`
        : `${sig.givenName} is in the Capital roost.`,
      roostEmpty: away,
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
        ? "The Fen Wyrm is away from Brinehold — coiled at the ford."
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
  const knowledge = [...world.dragonKnowledge.values()].filter((k) => k.playerId === playerId);
  const verbs = [...world.worldVerbs.values()].filter((v) => v.ownerPlayerId === playerId);
  return {
    clutchAvailable: clutchAvailable(world, playerId),
    fenRivalryAvailable: Boolean(signatureDragon(world, playerId)) && !fenWyrmFor(world, playerId),
    dragons,
    knowledge,
    verbs,
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
