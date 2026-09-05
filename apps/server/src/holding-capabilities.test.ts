import { describe, expect, it } from "vitest";

import { World } from "./world";

describe("differentiated holding capabilities", () => {
  it("earns the first holding through ordinary world actions before researching it", () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const { player, city } = world.createGuest("Ordinary Charter Lord", "northern_kingdom");
    world.adminGrant(player.id, {
      resources: { food: 100000, wood: 100000, stone: 100000, ore: 100000, crownmark: 100000 },
      units: { bowman: 5000 },
    });

    const finish = (job: { finishesAt: number }) => {
      job.finishesAt = world.now() - 1;
      world.processQueues(world.now());
    };
    const research = (techId: string) => finish(world.startResearch(city.id, player.id, techId));
    research("dragon_studies");
    research("dragon_studies");
    finish(world.startBuild(city.id, player.id, 2, "skyreost"));
    finish(world.startBuild(city.id, player.id, 2, "skyreost"));

    const attackCamp = (level: number) => {
      const camp = [...world.camps.values()].find((candidate) => candidate.level === level)!;
      const march = world.createMarch(player.id, {
        fromCityId: city.id, intent: "attack", targetType: "camp", targetId: camp.id,
        targetX: camp.x, targetY: camp.y, composition: { bowman: 400 },
      });
      march.arriveAt = 0;
      const report = world.landMarch(march, world.now())!;
      world.processMarches(world.now() + 100000);
      expect((report.result as { battle: { winner: string } }).battle.winner).toBe("attacker");
    };
    for (let i = 0; i < 6; i += 1) attackCamp(1);
    attackCamp(2);

    const scoutTarget = [...world.camps.values()].find((candidate) => candidate.level === 1)!;
    const scout = (target: { id: string; x: number; y: number }) => {
      const march = world.createMarch(player.id, {
        fromCityId: city.id, intent: "scout", targetType: "camp", targetId: target.id,
        targetX: target.x, targetY: target.y, composition: { bowman: 1 },
      });
      march.arriveAt = 0;
      world.landMarch(march, world.now());
      world.processMarches(world.now() + 100000);
    };
    scout(scoutTarget);

    expect(world.checkDragonReadiness(player.id).ready).toBe(true);
    expect(world.startExpedition(player.id, "first_dragon_expedition")).not.toBeNull();
    for (let stage = 1; stage <= 4; stage += 1) {
      expect(world.completeExpeditionStage(player.id, "first_dragon_expedition", stage)?.completed).toBe(stage === 4);
    }

    expect(world.foundMarcherKeep(player.id, "Earned Keep").kind).toBe("marcher_keep");
    const wild = [...world.wilderness.values()][0]!;
    const occupation = world.createMarch(player.id, {
      fromCityId: city.id, intent: "occupy", targetType: "wilderness", targetId: wild.id,
      targetX: wild.x, targetY: wild.y, composition: { bowman: 100 },
    });
    occupation.arriveAt = 0;
    world.landMarch(occupation, world.now());
    world.processMarches(world.now() + 100000);
    expect(wild.ownerPlayerId).toBe(player.id);
    const charterJob = world.startResearch(city.id, player.id, "brinehold_unlock");
    finish(charterJob);
    expect(city.research.brinehold_unlock).toBe(1);
    expect(world.foundBrinehold(player.id, "Earned Brinehold").kind).toBe("brinehold");

    // Full ladder: every rung earned through ordinary world actions.
    research("stonekeel_unlock");
    expect(world.foundCitadel(player.id, "stonekeel").kind).toBe("stonekeel");

    scout([...world.camps.values()].find((candidate) => candidate.level === 2)!);
    scout([...world.camps.values()].find((candidate) => candidate.level === 3)!);

    research("cinderreach_unlock");
    expect(world.foundCitadel(player.id, "cinderreach").kind).toBe("cinderreach");

    research("dragon_studies");
    expect(city.research.dragon_studies).toBe(3);

    research("galeari_unlock");
    expect(world.foundCitadel(player.id, "galeari").kind).toBe("galeari");

    // Founding the battle holding is what turns the presence BATTLE_READY,
    // and the War Council is its immediate player-facing consequence.
    expect(world.dragonPresence(player.id).state).toBe("BATTLE_READY");
    expect(() => world.startDragonWarCouncil(player.id)).not.toThrow();
  });

  it("keeps specialist rosters at their authoritative holding", () => {
    const world = new World({ persist: false });
    const { player, city } = world.createGuest("Holding Lord", "northern_kingdom");
    world.adminGrant(player.id, { resources: { food: 10000, wood: 10000, stone: 10000, ore: 10000 } });
    city.research.dragon_studies = 3;
    expect(() => world.startTrain(city.id, player.id, "dragon_slayer", 1)).toThrow(/only be trained at a galeari/);
  });

  it("rejects charter research until world-earned prerequisites exist", () => {
    const world = new World({ persist: false });
    const { player, city } = world.createGuest("Charter Lord", "northern_kingdom");
    world.adminGrant(player.id, { resources: { food: 10000, wood: 10000, crownmark: 10000 } });
    expect(() => world.startResearch(city.id, player.id, "brinehold_unlock")).toThrow(
      /Marcher Keep, three camp victories, and one wilderness holding/,
    );
  });
});
