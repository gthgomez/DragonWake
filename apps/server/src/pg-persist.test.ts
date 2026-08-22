/**
 * Restart-survival: create guest on World A → flush PG → load World B → session/city present.
 * Drives shipped PgStore + World paths (not a re-implementation).
 *
 * Honesty contract (B0.1):
 * - When Postgres is unreachable: tests are **skipped** (never silent pass).
 * - When REQUIRE_PG=1: suite **fails** if Postgres cannot connect.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { PgStore } from "./pg-store.js";
import { World } from "./world.js";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgres://tideforge:tideforge@127.0.0.1:5432/tideforge";

const REQUIRE_PG =
  process.env.REQUIRE_PG === "1" || process.env.REQUIRE_PG === "true";

let canRun = false;
let probeError: string | null = null;

beforeAll(async () => {
  const probe = await PgStore.connect(DATABASE_URL);
  if (probe) {
    canRun = true;
    await probe.close();
  } else {
    probeError = `Postgres unreachable at ${DATABASE_URL.replace(/:\/\/[^@]+@/, "://***@")}`;
    if (REQUIRE_PG) {
      throw new Error(
        `REQUIRE_PG=1 but ${probeError}. Start db (docker compose up -d db) or unset REQUIRE_PG.`,
      );
    }
  }
});

describe("PG persistence (shipped PgStore + World)", () => {
  it("survives World restart: guest + city + session still loadable", async ({
    skip,
  }) => {
    if (!canRun) {
      skip(
        probeError
          ? `${probeError} (set REQUIRE_PG=1 to fail hard)`
          : "Postgres not available",
      );
      return;
    }

    const name = `Persist_${Date.now()}`;

    const store1 = await PgStore.connect(DATABASE_URL);
    expect(store1).not.toBeNull();
    const world1 = new World({ devFastTime: true, skipTutorial: true });
    await world1.attachStore(store1!);

    const { player, city, token } = world1.createGuest(name, "northern_kingdom");
    expect(city.resources.food).toBeGreaterThan(0);
    world1.adminGrant(player.id, { units: { bowman: 42 }, chronite: 7 });
    world1.adminGrant(player.id, { resources: { food: 1234 } });

    // Posture cooldown armed on world1 — an immediate second change must throw.
    world1.setPosture(city.id, player.id, "garrison");
    expect(() => world1.setPosture(city.id, player.id, "full")).toThrow(
      /posture change on cooldown/,
    );

    // Daily quest state via public paths: queue a build (marks done.build),
    // then claim it (marks claimed.build).
    world1.startBuild(city.id, player.id, 5, "habitation");
    world1.claimDailyQuest(player.id, "build");

    // Daily clue usage via public path: land camp attacks until a clue drops
    // (L4 camps drop on ~70% of wins; 30 attempts make failure negligible).
    const camp = [...world1.camps.values()].find((c) => c.level === 4)!;
    for (let i = 0; i < 30 && world1.dailyClueUsage(player.id).used < 1; i++) {
      world1.adminGrant(player.id, { units: { bowman: 900 } });
      const m = world1.createMarch(player.id, {
        fromCityId: city.id,
        intent: "attack",
        targetType: "camp",
        targetId: camp.id,
        targetX: camp.x,
        targetY: camp.y,
        composition: { bowman: 450 },
      });
      m.arriveAt = 0;
      const report = world1.landMarch(m, world1.now());
      expect(report).not.toBeNull();
    }
    expect(world1.dailyClueUsage(player.id).used).toBeGreaterThanOrEqual(1);

    // Commanders (Commander System spec §9): recruit via public path, win a
    // battle for XP, wound a second via a lost battle, then arm a march so
    // busy_march_id is live at flush time.
    // NOTE: capture the returned job — an earlier habitation build is still
    // running, so scanning world.jobs would grab the wrong one.
    const galleryJob = world1.startBuild(city.id, player.id, 6, "command_gallery");
    galleryJob.finishesAt = world1.now() - 1;
    world1.processQueues(world1.now());
    const c1 = world1.recruitCommander(player.id);
    expect(c1.stars).toBe(1);

    // Win vs L1 camp → +100 xp
    world1.adminGrant(player.id, { units: { bowman: 300 } });
    const l1camp = [...world1.camps.values()].find((c) => c.level === 1)!;
    const winMarch = world1.createMarch(player.id, {
      fromCityId: city.id,
      intent: "attack",
      targetType: "camp",
      targetId: l1camp.id,
      targetX: l1camp.x,
      targetY: l1camp.y,
      composition: { bowman: 150 },
      commanderId: c1.id,
    });
    winMarch.arriveAt = 0;
    const winReport = world1.landMarch(winMarch, world1.now());
    expect(
      (winReport!.result.battle as { winner: string }).winner,
    ).toBe("attacker");
    winMarch.returnAt = 0;
    world1.processMarches(world1.now());
    expect(world1.commanders.get(c1.id)!.xp).toBe(100);

    // Second commander loses vs L10 camp → +25 xp + wounded
    // (gallery L2 raises roster cap to 2; capture the returned job again)
    const galleryJob2 = world1.startBuild(city.id, player.id, 6, "command_gallery");
    galleryJob2.finishesAt = world1.now() - 1;
    world1.processQueues(world1.now());
    world1.adminGrant(player.id, { resources: { coin: 5000, food: 9000 } });
    const c2 = world1.recruitCommander(player.id);
    const l10camp = [...world1.camps.values()].find((c) => c.level === 10)!;
    const lossMarch = world1.createMarch(player.id, {
      fromCityId: city.id,
      intent: "attack",
      targetType: "camp",
      targetId: l10camp.id,
      targetX: l10camp.x,
      targetY: l10camp.y,
      composition: { levy: 1 },
      commanderId: c2.id,
    });
    lossMarch.arriveAt = 0;
    const lossReport = world1.landMarch(lossMarch, world1.now());
    expect(
      (lossReport!.result.battle as { winner: string }).winner,
    ).toBe("defender");
    lossMarch.returnAt = 0;
    world1.processMarches(world1.now());

    // Arm c1 on a fresh scout march that stays en_route across the restart.
    const armedScout = world1.createMarch(player.id, {
      fromCityId: city.id,
      intent: "scout",
      targetType: "camp",
      targetId: l1camp.id,
      targetX: l1camp.x,
      targetY: l1camp.y,
      composition: { scout: 1 },
      commanderId: c1.id,
    });
    const expectedC1 = world1.commanders.get(c1.id)!;
    const expectedC2 = world1.commanders.get(c2.id)!;
    expect(expectedC1.busyMarchId).toBe(armedScout.id);
    expect(expectedC2.woundedUntil).not.toBeNull();
    expect(expectedC2.xp).toBe(25);

    // Snapshot pre-restart state for exact round-trip assertions — taken
    // AFTER all grants/marches so values match post-battle reality.
    const expectedBowman = world1.getCity(city.id)!.stacks.bowman;
    const expectedPosture = world1.getCity(city.id)!.defensePosture;

    await world1.flush();
    await store1!.close();

    const store2 = await PgStore.connect(DATABASE_URL);
    expect(store2).not.toBeNull();
    const world2 = new World({ devFastTime: true, skipTutorial: true });
    await world2.attachStore(store2!);

    const loadedPlayer = world2.players.get(player.id);
    expect(loadedPlayer).toBeTruthy();
    expect(loadedPlayer!.displayName).toBe(name);
    expect(loadedPlayer!.chronite).toBeGreaterThanOrEqual(7);

    const loadedCity = world2.cities.get(city.id);
    expect(loadedCity).toBeTruthy();
    expect(loadedCity!.mapX).toBe(city.mapX);
    expect(loadedCity!.mapY).toBe(city.mapY);
    expect(loadedCity!.resources.food).toBeGreaterThan(0);
    // M2 round-trip: canonical resource keys survive the renamed columns.
    expect(loadedCity!.resources.food).toBeGreaterThanOrEqual(1234);
    expect(loadedCity!.stacks.bowman).toBe(expectedBowman);
    expect(loadedCity!.defensePosture).toBe(expectedPosture);

    const viaSession = world2.sessionPlayer(token);
    expect(viaSession).not.toBeNull();
    expect(viaSession!.id).toBe(player.id);
    expect(world2.dbMode).toBe("postgres");

    // Posture cooldown survived the restart — immediate change still throws.
    expect(() => world2.setPosture(city.id, player.id, "full")).toThrow(
      /posture change on cooldown/,
    );

    // Daily clue usage survived the restart.
    const usage = world2.dailyClueUsage(player.id);
    expect(usage.used).toBeGreaterThanOrEqual(1);

    // Daily quest progress survived the restart.
    const buildQuest = world2
      .listDailyQuests(player.id)
      .find((q) => q.id === "build");
    expect(buildQuest?.done).toBe(true);
    expect(buildQuest?.claimed).toBe(true);

    // Commander roster survived with xp/busy/wounded intact (spec §9).
    const loadedC1 = world2.commanders.get(c1.id);
    expect(loadedC1).toBeTruthy();
    expect(loadedC1!.playerId).toBe(player.id);
    expect(loadedC1!.xp).toBe(100);
    expect(loadedC1!.stars).toBe(1);
    expect(loadedC1!.busyMarchId).toBe(armedScout.id);
    expect(world2.marches.get(armedScout.id)?.commanderId).toBe(c1.id);
    const loadedC2 = world2.commanders.get(c2.id);
    expect(loadedC2).toBeTruthy();
    expect(loadedC2!.xp).toBe(25);
    expect(loadedC2!.woundedUntil).not.toBeNull();
    expect(loadedC2!.woundedUntil).toBe(expectedC2.woundedUntil);

    await store2!.close();
  }, 20_000); // heavy round-trip (30 camp attacks + commanders); default too tight

  it("march land report survives reload", async ({ skip }) => {
    if (!canRun) {
      skip(
        probeError
          ? `${probeError} (set REQUIRE_PG=1 to fail hard)`
          : "Postgres not available",
      );
      return;
    }

    const store1 = await PgStore.connect(DATABASE_URL);
    const world1 = new World({ devFastTime: true, skipTutorial: true });
    await world1.attachStore(store1!);
    const { player, city } = world1.createGuest(
      `March_${Date.now()}`,
      "mountain_realm",
    );
    world1.adminGrant(player.id, { units: { bowman: 200, levy: 100 } });
    const camp = [...world1.camps.values()].find((c) => c.level === 1)!;
    const march = world1.createMarch(player.id, {
      fromCityId: city.id,
      intent: "attack",
      targetType: "camp",
      targetId: camp.id,
      targetX: camp.x,
      targetY: camp.y,
      composition: { bowman: 80, levy: 40 },
    });
    march.arriveAt = 0;
    const report = world1.landMarch(march, world1.now());
    expect(report).not.toBeNull();
    const reportId = report!.id;
    await world1.flush();
    await store1!.close();

    const store2 = await PgStore.connect(DATABASE_URL);
    const world2 = new World({ devFastTime: true, skipTutorial: true });
    await world2.attachStore(store2!);
    const loaded = world2.reports.get(reportId);
    expect(loaded).toBeTruthy();
    expect(loaded!.attackerPlayerId).toBe(player.id);
    const m = world2.marches.get(march.id);
    expect(m).toBeTruthy();
    expect(m!.landCount).toBe(1);
    expect(m!.battleReportId).toBe(reportId);
    await store2!.close();
  }, 20_000); // PG round-trip under load; default 5s is too tight
});
