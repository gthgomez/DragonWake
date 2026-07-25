/**
 * P0 polish gates: events, validation, rate limits.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { LIMITS, rateLimit, resetRateLimits } from "./rate-limit.js";
import { World } from "./world.js";

async function json(
  app: ReturnType<typeof createApp>,
  path: string,
  init?: RequestInit & { token?: string },
) {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json");
  if (init?.token) headers.set("Authorization", `Bearer ${init.token}`);
  const res = await app.request(path, { ...init, headers });
  const body = res.status === 204 ? null : await res.json();
  return { res, body };
}

describe("P0 rate limits", () => {
  beforeEach(() => resetRateLimits());

  it("blocks after window max", () => {
    const key = "test:rl";
    for (let i = 0; i < LIMITS.guest.max; i++) {
      expect(rateLimit(key, LIMITS.guest.max, LIMITS.guest.windowMs)).toBe(
        true,
      );
    }
    expect(rateLimit(key, LIMITS.guest.max, LIMITS.guest.windowMs)).toBe(
      false,
    );
  });
});

describe("P0 validation + events", () => {
  beforeEach(() => resetRateLimits());

  it("rejects invalid march body with VALIDATION", async () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const app = createApp(world);
    const g = await json(app, "/api/v1/auth/guest", {
      method: "POST",
      body: JSON.stringify({ displayName: "ValA", faction: "brinecant" }),
    });
    const bad = await json(app, "/api/v1/marches", {
      method: "POST",
      token: g.body.token,
      body: JSON.stringify({
        fromCityId: "not-a-uuid",
        intent: "attack",
        target: { type: "camp", x: 1, y: 1 },
        composition: { levy: 1 },
      }),
    });
    expect(bad.res.status).toBe(400);
    expect(bad.body.error.code).toBe("VALIDATION");
  });

  it("rejects bad posture with VALIDATION", async () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const app = createApp(world);
    const g = await json(app, "/api/v1/auth/guest", {
      method: "POST",
      body: JSON.stringify({ displayName: "ValB", faction: "ashcoil" }),
    });
    const bad = await json(app, `/api/v1/cities/${g.body.city.id}/posture`, {
      method: "POST",
      token: g.body.token,
      body: JSON.stringify({ posture: "banana" }),
    });
    expect(bad.res.status).toBe(400);
    expect(bad.body.error.code).toBe("VALIDATION");
  });

  it("emits queue_complete and march_land events pollable via /events", async () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const app = createApp(world);
    const g = await json(app, "/api/v1/auth/guest", {
      method: "POST",
      body: JSON.stringify({ displayName: "EvtA", faction: "brinecant" }),
    });
    const token = g.body.token as string;
    const cityId = g.body.city.id as string;

    await json(app, "/api/v1/admin/grant", {
      method: "POST",
      token,
      body: JSON.stringify({ units: { levy: 50 } }),
    });

    const train = await json(app, `/api/v1/cities/${cityId}/train`, {
      method: "POST",
      token,
      body: JSON.stringify({ unitId: "levy", count: 5 }),
    });
    expect(train.res.status).toBe(200);
    const jobId = train.body.job.id as string;
    const job = world.jobs.get(jobId)!;
    job.finishesAt = 0;
    world.tick();

    const camp = [...world.camps.values()].find((c) => c.level === 1)!;
    const marchRes = await json(app, "/api/v1/marches", {
      method: "POST",
      token,
      body: JSON.stringify({
        fromCityId: cityId,
        intent: "attack",
        target: { type: "camp", id: camp.id, x: camp.x, y: camp.y },
        composition: { levy: 20 },
      }),
    });
    expect(marchRes.res.status).toBe(200);
    const march = world.marches.get(marchRes.body.march.id as string)!;
    march.arriveAt = 0;
    world.tick();

    const events = await json(app, "/api/v1/events?since=0", { token });
    expect(events.res.status).toBe(200);
    const types = (events.body.events as { type: string }[]).map((e) => e.type);
    expect(types).toContain("queue_complete");
    expect(types).toContain("march_land");
    expect(types).toContain("report");
  });

  it("rate-limits guest creates with 429", async () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const app = createApp(world);
    let lastStatus = 200;
    for (let i = 0; i < LIMITS.guest.max + 3; i++) {
      const r = await json(app, "/api/v1/auth/guest", {
        method: "POST",
        body: JSON.stringify({
          displayName: `RL${i}`,
          faction: "brinecant",
        }),
        headers: { "x-forwarded-for": "203.0.113.50" },
      });
      lastStatus = r.res.status;
      if (r.res.status === 429) {
        expect(r.body.error.code).toBe("RATE_LIMIT");
        return;
      }
    }
    expect(lastStatus).toBe(429);
  });
});
