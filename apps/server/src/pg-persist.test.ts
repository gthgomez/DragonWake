/**
 * Restart-survival: create guest on World A → flush PG → load World B → session/city present.
 * Drives shipped PgStore + World paths (not a re-implementation).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PgStore } from "./pg-store.js";
import { World } from "./world.js";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgres://tideforge:tideforge@127.0.0.1:5432/tideforge";

describe("PG persistence (shipped PgStore + World)", () => {
  let canRun = false;

  beforeAll(async () => {
    const probe = await PgStore.connect(DATABASE_URL);
    if (probe) {
      canRun = true;
      await probe.close();
    }
  });

  afterAll(async () => {
    // nothing global
  });

  it("survives World restart: guest + city + session still loadable", async () => {
    if (!canRun) {
      // Optional gate: requires local Postgres; skip cleanly when daemon is down.
      return;
    }

    // Isolate test data with unique display name
    const name = `Persist_${Date.now()}`;

    const store1 = await PgStore.connect(DATABASE_URL);
    expect(store1).not.toBeNull();
    const world1 = new World({ devFastTime: true, skipTutorial: true });
    await world1.attachStore(store1!);

    const { player, city, token } = world1.createGuest(name, "brinecant");
    expect(city.resources.kelp).toBeGreaterThan(0);
    world1.adminGrant(player.id, { units: { reefbow: 42 }, chronite: 7 });
    await world1.flush();
    await store1!.close();

    // Simulate process restart: new World + new store connection
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
    expect(loadedCity!.resources.kelp).toBeGreaterThan(0);
    expect(loadedCity!.stacks.reefbow).toBe(42);

    // Session auth via token hash after reload
    const viaSession = world2.sessionPlayer(token);
    expect(viaSession).not.toBeNull();
    expect(viaSession!.id).toBe(player.id);

    // Health-style mode
    expect(world2.dbMode).toBe("postgres");

    await store2!.close();
  });

  it("march land report survives reload", async () => {
    if (!canRun) {
      return;
    }

    const store1 = await PgStore.connect(DATABASE_URL);
    const world1 = new World({ devFastTime: true, skipTutorial: true });
    await world1.attachStore(store1!);
    const { player, city } = world1.createGuest(`March_${Date.now()}`, "ashcoil");
    world1.adminGrant(player.id, { units: { reefbow: 200, levy: 100 } });
    const camp = [...world1.camps.values()].find((c) => c.level === 1)!;
    const march = world1.createMarch(player.id, {
      fromCityId: city.id,
      intent: "attack",
      targetType: "camp",
      targetId: camp.id,
      targetX: camp.x,
      targetY: camp.y,
      composition: { reefbow: 80, levy: 40 },
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
  });
});
