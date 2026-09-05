import { describe, expect, it } from "vitest";
import { World } from "../world.js";
import { VANE_READING, FEN_SILT } from "./types.js";

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

describe("DragonIndividual", () => {
  it("creates a named hatchling only after the Scar charter", () => {
    const w = world();
    const { player } = w.createGuest("Keeper", "northern_kingdom");
    expect(() => w.nameHatchling(player.id, "Ash")).toThrow(/clutch/);
    charter(w, player.id);
    w.faceScarEncounter(player.id, { levy: 40 });
    const d = w.nameHatchling(player.id, "Ash");
    expect(d.givenName).toBe("Ash");
    expect(d.kind).toBe("signature");
    expect(d.lifeStage).toBe("hatchling");
    expect(d.relationship).toBe("bonded");
    expect(w.livingState(player.id).dragons).toHaveLength(1);
  });

  it("rejects a second signature dragon and a Bond button equivalent", () => {
    const w = world();
    const { player } = w.createGuest("Once", "northern_kingdom");
    charter(w, player.id);
    w.faceScarEncounter(player.id, { levy: 40 });
    w.nameHatchling(player.id, "Ash");
    expect(() => w.nameHatchling(player.id, "Ember")).toThrow(/already named/);
  });

  it("does not share individuals across players", () => {
    const w = world();
    const a = w.createGuest("A", "northern_kingdom");
    const b = w.createGuest("B", "mountain_realm");
    charter(w, a.player.id);
    w.faceScarEncounter(a.player.id, { levy: 40 });
    const da = w.nameHatchling(a.player.id, "Ash");
    charter(w, b.player.id);
    w.faceScarEncounter(b.player.id, { levy: 40 });
    const db = w.nameHatchling(b.player.id, "Nettle");
    expect(da.id).not.toBe(db.id);
    expect(w.livingState(a.player.id).dragons[0]!.givenName).toBe("Ash");
    expect(w.livingState(b.player.id).dragons[0]!.givenName).toBe("Nettle");
  });
});

describe("signature growth and wounds", () => {
  it("grows hatchling to wyrmling only with time, observation, and research", () => {
    const w = world();
    const { player } = w.createGuest("Grow", "northern_kingdom");
    charter(w, player.id);
    w.faceScarEncounter(player.id, { levy: 40 });
    const d = w.nameHatchling(player.id, "Ash");
    expect(() => w.growLivingDragon(player.id, d.id)).toThrow(/time/);
    d.namedAt = w.now() - 120_000;
    w.dragonIndividuals.set(d.id, d);
    expect(() => w.growLivingDragon(player.id, d.id)).toThrow(/watch/);
    w.observeLivingDragon(player.id, d.id);
    w.growLivingDragon(player.id, d.id);
    expect(w.dragonIndividuals.get(d.id)!.lifeStage).toBe("wyrmling");
  });

  it("Home Guard on a hatchling wounds vanes and recovers without Chronite", () => {
    const w = world();
    const { player } = w.createGuest("Wound", "northern_kingdom");
    charter(w, player.id);
    w.faceScarEncounter(player.id, { levy: 40 });
    const d = w.nameHatchling(player.id, "Ash");
    w.setDragonHarness(player.id, d.id, "home_guard");
    const wounded = w.dragonIndividuals.get(d.id)!;
    expect(wounded.physicalState).toBe("wounded");
    expect(wounded.woundId).toBe("strained_vane");
    expect(wounded.harnessRole).toBe("yard");
    wounded.woundUntil = w.now() - 1;
    w.tick(w.now());
    expect(w.dragonIndividuals.get(d.id)!.physicalState).toBe("healthy");
  });
});

describe("research evidence", () => {
  it("advances Vane Reading organically and refuses instant prove", () => {
    const w = world();
    const { player } = w.createGuest("Scribe", "northern_kingdom");
    charter(w, player.id);
    w.faceScarEncounter(player.id, { levy: 40 });
    const d = w.nameHatchling(player.id, "Ash");
    expect(() => w.codifyDragonKnowledge(player.id, VANE_READING)).toThrow(/supported/);
    w.observeLivingDragon(player.id, d.id);
    w.observeLivingDragon(player.id, d.id);
    const proven = w.codifyDragonKnowledge(player.id, VANE_READING);
    expect(proven.state).toBe("proven");
    const again = w.observeLivingDragon(player.id, d.id);
    expect(again.observeCount).toBeGreaterThan(2);
    const k = w.dragonKnowledge.get(`${player.id}:${VANE_READING}`)!;
    expect(k.state).toBe("proven");
  });
});

describe("domain Fen Wyrm", () => {
  it("pacts a local adult distinct from the hatchling", () => {
    const w = world();
    const a = w.createGuest("Pacter", "northern_kingdom");
    charter(w, a.player.id);
    w.faceScarEncounter(a.player.id, { levy: 40 });
    const hatch = w.nameHatchling(a.player.id, "Ash");
    w.foundMarcherKeep(a.player.id, "Frontier");
    const fen = w.beginFenRivalry(a.player.id);
    expect(fen.kind).toBe("domain");
    expect(fen.lifeStage).toBe("mature");
    expect(fen.id).not.toBe(hatch.id);
    w.observeLivingDragon(a.player.id, fen.id);
    const pact = w.pactLocalFenWyrm(a.player.id);
    expect(pact.dragon.relationship).toBe("pacted");
    expect(pact.city.kind).toBe("brinehold");
    expect(pact.verb.verb).toBe("ford_blockade");
    expect(pact.dragon.givenName).toBeNull();
    expect(w.livingState(a.player.id).dragons.find((d) => d.id === hatch.id)?.givenName).toBe("Ash");
  });

  it("Home/Away is unique and scoutable; verbs do not leak to another player", () => {
    const w = world();
    const a = w.createGuest("LordA", "northern_kingdom");
    const b = w.createGuest("LordB", "mountain_realm");
    charter(w, a.player.id);
    w.faceScarEncounter(a.player.id, { levy: 40 });
    w.nameHatchling(a.player.id, "Ash");
    w.foundMarcherKeep(a.player.id, "A Keep");
    const fen = w.beginFenRivalry(a.player.id);
    w.observeLivingDragon(a.player.id, fen.id);
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
    expect(JSON.stringify(intel)).toMatch(/away from Brinehold|ford/i);
    charter(w, b.player.id);
    w.faceScarEncounter(b.player.id, { levy: 40 });
    w.nameHatchling(b.player.id, "Nettle");
    w.foundMarcherKeep(b.player.id, "B Keep");
    const fenB = w.beginFenRivalry(b.player.id);
    expect(fenB.id).not.toBe(fen.id);
    expect(w.dragonIndividuals.get(fen.id)!.locationKind).toBe("ford");
  });

  it("rejects Ford/Blockade on unauthorized territory", () => {
    const w = world();
    const a = w.createGuest("Owner", "northern_kingdom");
    charter(w, a.player.id);
    w.faceScarEncounter(a.player.id, { levy: 40 });
    w.nameHatchling(a.player.id, "Ash");
    w.foundMarcherKeep(a.player.id, "Keep");
    const fen = w.beginFenRivalry(a.player.id);
    w.observeLivingDragon(a.player.id, fen.id);
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
    charter(w, player.id);
    w.faceScarEncounter(player.id, { levy: 40 });
    w.nameHatchling(player.id, "Ash");
    w.foundMarcherKeep(player.id, "Keep");
    const fen = w.beginFenRivalry(player.id);
    w.observeLivingDragon(player.id, fen.id);
    w.observeLivingDragon(player.id, fen.id);
    w.codifyDragonKnowledge(player.id, FEN_SILT);
    w.observeLivingDragon(player.id, fen.id);
    expect(w.dragonKnowledge.get(`${player.id}:${FEN_SILT}`)!.state).toBe("proven");
  });
});
