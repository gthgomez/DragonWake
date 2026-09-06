import { describe, expect, it } from "vitest";
import { World } from "../world.js";
import { VANE_READING, FEN_SILT } from "./types.js";
import { scoreTerritoryEncounter } from "./living.js";

function world() {
  return new World({ devFastTime: true, skipTutorial: true });
}

function charter(w: World, playerId: string) {
  w.checkDragonReadiness(playerId);
  const p = w.dragonProgress.get(playerId)!;
  p.bestiaryStudied = 3;
  p.researchLevel = 2;
  p.materialsCollected = 5;
  p.campTypesDefeated = new Set(["a", "b"]);
  p.expeditionStage = 4;
  p.charterEarned = false;
  p.campsDefeated = 10;
  p.scoutsSent = 4;
  w.touchDragonProgress(playerId, p);
}

function surviveScar(w: World, playerId: string) {
  const result = w.faceScarEncounter(playerId, { levy: 40 });
  expect(result.outcome).toBe("survived");
  expect(result.charterEarned).toBe(true);
  return result;
}

/** The authored journey through the encounter, hatchling, and the crossing. */
function fullJourney(w: World, playerId: string) {
  charter(w, playerId);
  surviveScar(w, playerId);
  w.nameHatchling(playerId, "Ash");
  w.foundMarcherKeep(playerId, "Frontier");
  const fen = w.beginFenRivalry(playerId);
  const crossing = w.livingState(playerId).crossings[0];
  return { fen, crossing };
}

describe("DragonIndividual", () => {
  it("creates a named hatchling only after surviving the Scar", () => {
    const w = world();
    const { player } = w.createGuest("Keeper", "northern_kingdom");
    expect(() => w.nameHatchling(player.id, "Ash")).toThrow(/clutch/);
    charter(w, player.id);
    surviveScar(w, player.id);
    const d = w.nameHatchling(player.id, "Ash");
    expect(d.givenName).toBe("Ash");
    expect(d.kind).toBe("signature");
    expect(d.lifeStage).toBe("hatchling");
    expect(d.harness).toBe("none");
    expect(w.livingState(player.id).dragons).toHaveLength(1);
  });

  it("keeps the Scar encounter evidence through naming", () => {
    const w = world();
    const { player } = w.createGuest("Keeper", "northern_kingdom");
    charter(w, player.id);
    surviveScar(w, player.id);
    w.nameHatchling(player.id, "Ash");
    const k = w.dragonKnowledge.get(`${player.id}:${VANE_READING}`)!;
    expect(k.evidence.some((e) => e.kind === "encounter" && e.worldSourced)).toBe(true);
  });

  it("rejects a second signature dragon and a Bond button equivalent", () => {
    const w = world();
    const { player } = w.createGuest("Once", "northern_kingdom");
    charter(w, player.id);
    surviveScar(w, player.id);
    w.nameHatchling(player.id, "Ash");
    expect(() => w.nameHatchling(player.id, "Ember")).toThrow(/already named/);
  });

  it("does not share individuals across players", () => {
    const w = world();
    const a = w.createGuest("A", "northern_kingdom");
    const b = w.createGuest("B", "mountain_realm");
    charter(w, a.player.id);
    surviveScar(w, a.player.id);
    const da = w.nameHatchling(a.player.id, "Ash");
    charter(w, b.player.id);
    surviveScar(w, b.player.id);
    const db = w.nameHatchling(b.player.id, "Nettle");
    expect(da.id).not.toBe(db.id);
    expect(w.livingState(a.player.id).dragons[0]!.givenName).toBe("Ash");
    expect(w.livingState(b.player.id).dragons[0]!.givenName).toBe("Nettle");
  });
});

describe("the authored Scar encounter", () => {
  it("is survived by an anchored spear column", () => {
    const r = scoreTerritoryEncounter({ levy: 40 });
    expect(r.outcome).toBe("survived");
    expect(r.phases).toHaveLength(3);
    expect(r.phases.map((p) => p.behavior)).toEqual([
      "wing_rush",
      "vane_dive",
      "breaking_pressure",
    ]);
  });

  it("punishes uncovered bow lines with a driven-back retreat", () => {
    const r = scoreTerritoryEncounter({ bowman: 30, levy: 10 });
    expect(r.outcome).toBe("driven_back");
    const dive = r.phases.find((p) => p.behavior === "vane_dive")!;
    expect(Object.values(dive.losses ?? {}).reduce((a: number, b) => a + (b as number), 0)).toBeGreaterThan(0);
  });

  it("routes loose unanchored companies", () => {
    const r = scoreTerritoryEncounter({ light_cavalry: 30, man_at_arms: 10 });
    expect(r.outcome).toBe("routed");
  });

  it("never kills the adult and charges no loot — survival earns the charter", () => {
    const w = world();
    const { player } = w.createGuest("Surv", "northern_kingdom");
    charter(w, player.id);
    const before = w.citiesForPlayer(player.id)[0]!.resources;
    const result = w.faceScarEncounter(player.id, { levy: 40 });
    expect(result.outcome).toBe("survived");
    expect(result.charterEarned).toBe(true);
    const after = w.citiesForPlayer(player.id)[0]!.resources;
    expect(after).toEqual(before);
  });

  it("driven-back and routed companies keep the expedition stage", () => {
    const w = world();
    const { player, city } = w.createGuest("Retry", "northern_kingdom");
    charter(w, player.id);
    // A loose, unanchored company is routed; the stage must stay retryable.
    city.stacks.light_cavalry = 30;
    city.stacks.man_at_arms = 10;
    const routed = w.faceScarEncounter(player.id, { light_cavalry: 30, man_at_arms: 10 });
    expect(routed.outcome).toBe("routed");
    expect(routed.charterEarned).toBe(false);
    expect(w.dragonProgress.get(player.id)!.expeditionStage).toBe(4);
    const survived = w.faceScarEncounter(player.id, { levy: 40 });
    expect(survived.outcome).toBe("survived");
    expect(survived.charterEarned).toBe(true);
  });
});

describe("signature growth", () => {
  it("grows hatchling to wyrmling only with time and supported Vane Reading", () => {
    const w = world();
    const { player } = w.createGuest("Grow", "northern_kingdom");
    charter(w, player.id);
    surviveScar(w, player.id);
    const d = w.nameHatchling(player.id, "Ash");
    expect(() => w.growLivingDragon(player.id, d.id)).toThrow(/time/);
    d.namedAt = w.now() - 120_000;
    w.dragonIndividuals.set(d.id, d);
    // Encounter evidence alone is one kind — growth still refuses.
    expect(() => w.growLivingDragon(player.id, d.id)).toThrow(/vanes/);
    // A roost observation is a second, distinct kind → supported.
    w.observeLivingDragon(player.id, d.id);
    w.growLivingDragon(player.id, d.id);
    expect(w.dragonIndividuals.get(d.id)!.lifeStage).toBe("wyrmling");
  });

  it("wounds stay supported by architecture and recover without Chronite", () => {
    const w = world();
    const { player } = w.createGuest("Wound", "northern_kingdom");
    charter(w, player.id);
    surviveScar(w, player.id);
    const d = w.nameHatchling(player.id, "Ash");
    // No wound may ever be caused by clicking a normal role.
    d.physicalState = "wounded";
    d.woundId = "strained_vane";
    d.woundUntil = w.now() + 60_000;
    w.dragonIndividuals.set(d.id, d);
    w.setDragonHarness(player.id, d.id, "yard");
    const kept = w.dragonIndividuals.get(d.id)!;
    expect(kept.physicalState).toBe("wounded");
    kept.woundUntil = w.now() - 1;
    w.dragonIndividuals.set(d.id, kept);
    w.tick(w.now());
    expect(w.dragonIndividuals.get(d.id)!.physicalState).toBe("healthy");
  });
});

describe("the guard harness", () => {
  function grownWyrmling(w: World, playerId: string) {
    charter(w, playerId);
    surviveScar(w, playerId);
    const d = w.nameHatchling(playerId, "Ash");
    w.observeLivingDragon(playerId, d.id);
    d.namedAt = w.now() - 120_000;
    w.dragonIndividuals.set(d.id, d);
    return w.growLivingDragon(playerId, d.id);
  }

  it("refuses Home Guard for a hatchling without wound or penalty", () => {
    const w = world();
    const { player } = w.createGuest("Young", "northern_kingdom");
    charter(w, player.id);
    surviveScar(w, player.id);
    const d = w.nameHatchling(player.id, "Ash");
    expect(() => w.setDragonHarness(player.id, d.id, "home_guard")).toThrow(/yard/);
    const after = w.dragonIndividuals.get(d.id)!;
    expect(after.physicalState).toBe("healthy");
    expect(after.woundId).toBeNull();
    expect(after.harnessRole).toBe("yard");
  });

  it("gates Home Guard behind the crafted Guard Harness", () => {
    const w = world();
    const { player } = w.createGuest("Harness", "northern_kingdom");
    const d = grownWyrmling(w, player.id);
    expect(() => w.setDragonHarness(player.id, d.id, "home_guard")).toThrow(/guard harness/);
    const before = { ...w.citiesForPlayer(player.id)[0]!.resources };
    w.craftGuardHarness(player.id);
    const capital = w.citiesForPlayer(player.id)[0]!;
    expect(capital.resources.wood).toBe(before.wood - 120);
    expect(capital.resources.ore).toBe(before.ore - 80);
    expect(w.dragonIndividuals.get(d.id)!.harness).toBe("guard_harness");
    w.setDragonHarness(player.id, d.id, "home_guard");
    const posted = w.dragonIndividuals.get(d.id)!;
    expect(posted.harnessRole).toBe("home_guard");
    expect(posted.locationKind).toBe("approaches");
    expect(w.livingState(player.id).dragons[0]!.roostEmpty).toBe(true);
    w.setDragonHarness(player.id, d.id, "yard");
    expect(w.dragonIndividuals.get(d.id)!.locationKind).toBe("roost");
  });

  it("degrades enemy capital intel while Home Guard is posted — hides, never lies", () => {
    const w = world();
    const a = w.createGuest("Guarded", "northern_kingdom");
    const b = w.createGuest("Spy", "mountain_realm");
    const d = grownWyrmling(w, a.player.id);
    w.craftGuardHarness(a.player.id);
    w.setDragonHarness(a.player.id, d.id, "home_guard");
    const intel = w.buildScoutIntel({
      id: "m",
      realmId: 1,
      playerId: b.player.id,
      fromCityId: b.city.id,
      commanderId: null,
      intent: "scout",
      targetType: "city",
      targetId: a.city.id,
      targetX: a.city.mapX,
      targetY: a.city.mapY,
      composition: { scout: 1 },
      cargo: {},
      departAt: 0,
      arriveAt: 0,
      returnAt: null,
      status: "en_route",
      battleReportId: null,
      landCount: 0,
      reinforcement: null,
    });
    const text = JSON.stringify(intel);
    expect(text).toMatch(/could not be confirmed/);
    const sig = (intel as { dragon?: { roostEmpty?: unknown } }).dragon;
    if (sig) expect(sig.roostEmpty).toBeNull();
  });
});

describe("research evidence", () => {
  it("advances on distinct kinds and refuses same-kind farming", () => {
    const w = world();
    const { player } = w.createGuest("Scribe", "northern_kingdom");
    charter(w, player.id);
    surviveScar(w, player.id);
    const d = w.nameHatchling(player.id, "Ash");
    // Encounter tell = observed (one kind).
    expect(w.dragonKnowledge.get(`${player.id}:${VANE_READING}`)!.state).toBe("observed");
    expect(() => w.codifyDragonKnowledge(player.id, VANE_READING)).toThrow(/supported/);
    // Repeating the roost tell accumulates notes and never advances alone…
    w.observeLivingDragon(player.id, d.id);
    expect(w.dragonKnowledge.get(`${player.id}:${VANE_READING}`)!.state).toBe("supported");
    const before = w.dragonKnowledge.get(`${player.id}:${VANE_READING}`)!.evidence.length;
    w.observeLivingDragon(player.id, d.id);
    const k = w.dragonKnowledge.get(`${player.id}:${VANE_READING}`)!;
    expect(k.evidence.length).toBe(before + 1);
    expect(k.state).toBe("supported");
    // …and CODIFY is the only road to PROVEN.
    const proven = w.codifyDragonKnowledge(player.id, VANE_READING);
    expect(proven.state).toBe("proven");
    w.observeLivingDragon(player.id, d.id);
    expect(w.dragonKnowledge.get(`${player.id}:${VANE_READING}`)!.state).toBe("proven");
  });

  it("requires a world-sourced observation before SUPPORTED", () => {
    const w = world();
    const { player } = w.createGuest("Cloister", "northern_kingdom");
    charter(w, player.id);
    surviveScar(w, player.id);
    const d = w.nameHatchling(player.id, "Ash");
    // Strip the world-sourced encounter record: roost notes alone must
    // never reach SUPPORTED, no matter how often they repeat.
    const key = `${player.id}:${VANE_READING}`;
    const only = w.dragonKnowledge.get(key)!;
    only.evidence = only.evidence.filter((e) => !e.worldSourced);
    w.observeLivingDragon(player.id, d.id);
    w.observeLivingDragon(player.id, d.id);
    const k = w.dragonKnowledge.get(key)!;
    expect(k.state).toBe("observed");
    expect(k.evidence.length).toBeGreaterThan(1);
  });
});

describe("domain Fen Wyrm and the Fen Crossing", () => {
  it("places the crossing contested before any pact is possible", () => {
    const w = world();
    const { player } = w.createGuest("Pacter", "northern_kingdom");
    const { fen, crossing } = fullJourney(w, player.id);
    expect(fen.kind).toBe("domain");
    expect(fen.lifeStage).toBe("mature");
    expect(crossing.state).toBe("contested");
    expect(() => w.pactLocalFenWyrm(player.id)).toThrow(/observe/);
  });

  it("requires observe → survey → supported → yield → codified signaling → pact", () => {
    const w = world();
    const { player } = w.createGuest("Diplomat", "northern_kingdom");
    const { fen, crossing } = fullJourney(w, player.id);
    // Pact before signaling is refused.
    w.observeLivingDragon(player.id, fen.id);
    expect(() => w.pactLocalFenWyrm(player.id)).toThrow(/signaling/);
    // Survey grants world-sourced scouting notes; with the encounter
    // observation the silt question reaches SUPPORTED.
    w.surveyFenCrossing(player.id);
    expect(w.dragonKnowledge.get(`${player.id}:${FEN_SILT}`)!.state).toBe("supported");
    // Signaling must be codified before terms can be read — and even a
    // codified keeper is refused while the crossing is still contested.
    w.codifyDragonKnowledge(player.id, FEN_SILT);
    expect(() => w.pactLocalFenWyrm(player.id)).toThrow(/contested/);
    // Yield the bank — the permanent world cost — then the pact stands.
    const yielded = w.yieldSpawningBank(player.id);
    expect(yielded.state).toBe("sanctuary");
    expect(yielded.yieldedAt).not.toBeNull();
    const pact = w.pactLocalFenWyrm(player.id);
    expect(pact.dragon.relationship).toBe("pacted");
    expect(pact.city.kind).toBe("brinehold");
    expect(pact.verb.verb).toBe("ford_blockade");
    expect(pact.verb.terms).toBe("spawning_bank_yielded");
    // The ford verb is bound to the pre-existing crossing tile.
    expect(pact.verb.tileX).toBe(crossing.x);
    expect(pact.verb.tileY).toBe(crossing.y);
    expect(w.livingState(player.id).dragons.find((d) => d.id === fen.id)?.givenName).toBeNull();
  });

  it("forbids working the crossing tile in either state", () => {
    const w = world();
    const { player, city } = w.createGuest("Claimer", "northern_kingdom");
    const { fen, crossing } = fullJourney(w, player.id);
    const wild = {
      id: "wild-crossing",
      realmId: 1,
      x: crossing.x,
      y: crossing.y,
      level: 2,
      resourceType: "food",
      ownerPlayerId: null,
    } as never;
    w.wilderness.set("wild-crossing", wild);
    expect(() =>
      w.createMarch(player.id, {
        fromCityId: city.id,
        intent: "occupy",
        targetType: "wilderness",
        targetId: "wild-crossing",
        targetX: crossing.x,
        targetY: crossing.y,
        composition: { levy: 10 },
      }),
    ).toThrow(/crossing/i);
    // Yield needs the silt understood first (observe + survey).
    w.observeLivingDragon(player.id, fen.id);
    w.surveyFenCrossing(player.id);
    w.yieldSpawningBank(player.id);
    expect(() =>
      w.createMarch(player.id, {
        fromCityId: city.id,
        intent: "occupy",
        targetType: "wilderness",
        targetId: "wild-crossing",
        targetX: crossing.x,
        targetY: crossing.y,
        composition: { levy: 10 },
      }),
    ).toThrow(/sanctuary/i);
  });

  it("Home/Away is unique and scoutable; verbs do not leak to another player", () => {
    const w = world();
    const a = w.createGuest("LordA", "northern_kingdom");
    const b = w.createGuest("LordB", "mountain_realm");
    const { fen } = fullJourney(w, a.player.id);
    w.observeLivingDragon(a.player.id, fen.id);
    w.surveyFenCrossing(a.player.id);
    w.yieldSpawningBank(a.player.id);
    w.codifyDragonKnowledge(a.player.id, FEN_SILT);
    w.pactLocalFenWyrm(a.player.id);
    w.stationLocalFenWyrm(a.player.id, "ford");
    expect(w.dragonIndividuals.get(fen.id)!.locationKind).toBe("ford");
    const brine = w.citiesForPlayer(a.player.id).find((c) => c.kind === "brinehold")!;
    const intel = w.buildScoutIntel({
      id: "m",
      realmId: 1,
      playerId: b.player.id,
      fromCityId: b.city.id,
      commanderId: null,
      intent: "scout",
      targetType: "city",
      targetId: brine.id,
      targetX: brine.mapX,
      targetY: brine.mapY,
      composition: { scout: 1 },
      cargo: {},
      departAt: 0,
      arriveAt: 0,
      returnAt: null,
      status: "en_route",
      battleReportId: null,
      landCount: 0,
      reinforcement: null,
    });
    expect(JSON.stringify(intel)).toMatch(/away from Brinehold|crossing/i);
    charter(w, b.player.id);
    surviveScar(w, b.player.id);
    w.nameHatchling(b.player.id, "Nettle");
    w.foundMarcherKeep(b.player.id, "B Keep");
    const fenB = w.beginFenRivalry(b.player.id);
    expect(fenB.id).not.toBe(fen.id);
    expect(w.dragonIndividuals.get(fen.id)!.locationKind).toBe("ford");
  });

  it("rejects Ford/Blockade on unauthorized territory", () => {
    const w = world();
    const a = w.createGuest("Owner", "northern_kingdom");
    const { fen } = fullJourney(w, a.player.id);
    w.observeLivingDragon(a.player.id, fen.id);
    w.surveyFenCrossing(a.player.id);
    w.yieldSpawningBank(a.player.id);
    w.codifyDragonKnowledge(a.player.id, FEN_SILT);
    const { verb } = w.pactLocalFenWyrm(a.player.id);
    const b = w.createGuest("Raider", "forest_people");
    expect(() => w.stationLocalFenWyrm(b.player.id, "ford")).toThrow();
    expect(verb.ownerPlayerId).toBe(a.player.id);
    expect(w.worldVerbs.size).toBe(1);
  });
});

describe("knowledge fen silt", () => {
  it("cannot farm PROVEN by repeating observe after codify", () => {
    const w = world();
    const { player } = w.createGuest("FenScribe", "northern_kingdom");
    const { fen } = fullJourney(w, player.id);
    w.observeLivingDragon(player.id, fen.id);
    w.surveyFenCrossing(player.id);
    expect(w.dragonKnowledge.get(`${player.id}:${FEN_SILT}`)!.state).toBe("supported");
    w.codifyDragonKnowledge(player.id, FEN_SILT);
    w.observeLivingDragon(player.id, fen.id);
    w.observeLivingDragon(player.id, fen.id);
    const k = w.dragonKnowledge.get(`${player.id}:${FEN_SILT}`)!;
    expect(k.state).toBe("proven");
    expect(k.evidence.length).toBeGreaterThan(3);
  });
});
