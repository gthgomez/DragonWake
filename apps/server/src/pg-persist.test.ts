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

    const { player, city, token } = world1.createGuest(name, "brinecant");
    expect(city.resources.food).toBeGreaterThan(0);
    world1.adminGrant(player.id, { units: { bowman: 42 }, chronite: 7 });
    world1.adminGrant(player.id, { resources: { food: 1234 } });
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
    expect(loadedCity!.stacks.bowman).toBe(42);

    const viaSession = world2.sessionPlayer(token);
    expect(viaSession).not.toBeNull();
    expect(viaSession!.id).toBe(player.id);
    expect(world2.dbMode).toBe("postgres");

    await store2!.close();
  });

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
      "ashcoil",
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
  });
});
