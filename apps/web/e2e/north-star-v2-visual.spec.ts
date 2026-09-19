import { test, expect, type Page } from "@playwright/test";

/**
 * North Star V2 — Castle settlement visual convergence.
 *
 * Class A evidence generation (per docs/product/VISUAL_QA_STRATEGY.md): it
 * reproduces a representative capital through REAL authoritative state and
 * captures the rendered product. It is not a pixel-perfect Class B test.
 *
 * This harness FAILS CLOSED: every setup action must succeed and the exact
 * authoritative city state is asserted before any capture.
 *
 * Run: pnpm --filter @dragonwake/web e2e north-star-v2-visual
 * Output: apps/web/e2e/artifacts/north-star-v2/ (untracked raw captures)
 */
const OUT = "e2e/artifacts/north-star-v2";
const API = process.env.VITE_API_URL ?? "http://localhost:3001";
const MIN_TAP = 44; // repository touch-target contract

const BUILD_PLAN: [number, string, number][] = [
  [1, "habitation", 7],
  [2, "barracks", 4],
  [3, "archive_spire", 1],
  [4, "rally_quay", 7],
  [5, "command_gallery", 1],
  [6, "lookout", 4],
  [7, "skyreost", 4],
  [8, "saltvault", 1],
  [9, "training_camp", 1],
];

type CityBuilding = { slotIndex: number; buildingType: string; level: number };

async function api(
  page: Page,
  token: string,
  method: "get" | "post",
  path: string,
  data?: unknown,
) {
  const res = await page.request[method](`${API}/api/v1${path}`, {
    headers: { authorization: `Bearer ${token}` },
    data,
  });
  if (!res.ok()) {
    throw new Error(`${method.toUpperCase()} ${path} -> ${res.status()} ${(await res.text()).slice(0, 200)}`);
  }
  return res.json();
}

async function enterRealm(page: Page, name: string): Promise<string> {
  await page.goto("/");
  await page.getByLabel("Display name").fill(name);
  await page.getByRole("button", { name: "Enter realm" }).click();
  await page.getByRole("button", { name: "Castle", exact: true }).waitFor({ timeout: 20_000 });
  const token = await page.evaluate(() => localStorage.getItem("dragonwake_token"));
  if (!token) throw new Error("no session token after entering the realm");
  return token;
}

async function getCity(page: Page, token: string) {
  const me = (await api(page, token, "get", "/me")) as {
    cities: { id: string; keepLevel?: number; buildings: CityBuilding[] }[];
  };
  const city = me.cities[0];
  if (!city) throw new Error("no capital city for player");
  return city;
}

async function drain(page: Page, token: string, cityId: string) {
  for (let i = 0; i < 200; i++) {
    const q = (await api(page, token, "get", `/cities/${cityId}/queues`)) as {
      jobs?: { status: string; kind?: string }[];
    };
    const running = (q.jobs ?? []).filter((j) => j.status === "running");
    if (running.length === 0) return;
    await page.waitForTimeout(600);
  }
  throw new Error(`queue did not drain for city ${cityId}`);
}

async function grant(page: Page, token: string, data: unknown) {
  await api(page, token, "post", "/admin/grant", data);
}

/** Raise the keep to `level`, failing if any upgrade is rejected. */
async function raiseKeep(page: Page, token: string, cityId: string, level: number) {
  for (let i = 1; i < level; i++) {
    await api(page, token, "post", `/cities/${cityId}/keep/upgrade`);
    await drain(page, token, cityId);
  }
}

async function build(
  page: Page,
  token: string,
  cityId: string,
  slot: number,
  type: string,
  level: number,
) {
  for (let i = 0; i < level; i++) {
    await api(page, token, "post", `/cities/${cityId}/buildings`, {
      slotIndex: slot,
      buildingType: type,
    });
    await drain(page, token, cityId);
  }
}

/** Assert the exact authoritative building set (no drift, no omissions). */
async function assertCityState(
  page: Page,
  token: string,
  cityId: string,
  expected: Map<number, { type: string; level: number }>,
  expectedKeep: number,
) {
  const city = await getCity(page, token);
  expect(city.id).toBe(cityId);
  expect(city.keepLevel).toBe(expectedKeep);
  const actual = city.buildings
    .map((b) => `${b.slotIndex}:${b.buildingType}:${b.level}`)
    .sort();
  const want = [...expected.entries()]
    .map(([slot, v]) => `${slot}:${v.type}:${v.level}`)
    .sort();
  expect(actual).toEqual(want);
}

async function setupCapital(page: Page, token: string, name: string) {
  const city = await getCity(page, token);
  const cityId = city.id;
  const initial = new Map(city.buildings.map((b) => [b.slotIndex, b.level]));

  await grant(page, token, {
    resources: { food: 9_000_000, wood: 9_000_000, stone: 9_000_000, ore: 9_000_000, crownmark: 9_000_000 },
  });

  await raiseKeep(page, token, cityId, 8);
  // Dragon Watch is gated on Dragon Studies; research it for real.
  for (let i = 0; i < 2; i++) {
    await api(page, token, "post", `/cities/${cityId}/research`, { techId: "dragon_studies" });
    await drain(page, token, cityId);
  }

  const expected = new Map<number, { type: string; level: number }>();
  expected.set(0, { type: "forge_heart", level: 8 });
  for (const [slot, type, level] of BUILD_PLAN) {
    if (slot === 7) continue; // built explicitly below at its own level
    await build(page, token, cityId, slot, type, level);
    expected.set(slot, { type, level: (initial.get(slot) ?? 0) + level });
  }
  await build(page, token, cityId, 7, "skyreost", 4);
  expected.set(7, { type: "skyreost", level: 4 });

  await drain(page, token, cityId);
  await assertCityState(page, token, cityId, expected, 8);
  return { cityId, name };
}

async function openScene(page: Page, token: string) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Castle", exact: true }).waitFor();
  await page.getByTestId("castle-scene").scrollIntoViewIfNeeded();
  await page.waitForTimeout(6000);
}

test.describe("North Star V2 — Castle settlement", () => {
  test("reference captures: default / selected / mobile / construction", async ({ page }) => {
    test.setTimeout(600_000);
    page.on("pageerror", (e) => console.log("[nsv2 pageerror]", e.message));
    const name = `NorthStar ${Date.now() % 1000000}`;
    const token = await enterRealm(page, name);
    await setupCapital(page, token, name);

    await openScene(page, token);
    await page.screenshot({ path: `${OUT}/after_desktop.png`, fullPage: true });
    await page.getByTestId("castle-scene").screenshot({ path: `${OUT}/after_scene_desktop.png` });

    await page.getByRole("button", { name: /^Homes, level/ }).first().click({ force: true });
    await page.waitForTimeout(800);
    await page.getByTestId("castle-scene").screenshot({ path: `${OUT}/after_building-selected_desktop.png` });

    // Mobile at the SAME state: the world stays usable and every interactive
    // region meets the 44px touch contract.
    const mobile = await page.context().browser()!.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    await mobile.addInitScript((t) => localStorage.setItem("dragonwake_token", t), token);
    const mp = await mobile.newPage();
    await openScene(mp, token);
    await mp.screenshot({ path: `${OUT}/after_mobile.png`, fullPage: true });
    await mp.getByTestId("castle-scene").screenshot({ path: `${OUT}/after_scene_mobile.png` });

    const hits = await mp.$$eval(".scene-hit", (els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { w: r.width, h: r.height };
      }),
    );
    expect(hits.length).toBeGreaterThanOrEqual(12);
    for (const h of hits) {
      expect(h.w).toBeGreaterThanOrEqual(MIN_TAP);
      expect(h.h).toBeGreaterThanOrEqual(MIN_TAP);
    }
    const overflow = await mp.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);

    await mp.getByRole("button", { name: /^Barracks, level 4/ }).first().click({ force: true });
    await expect(
      mp.locator(".city-detail").getByRole("heading", { name: "Barracks", exact: true }),
    ).toBeVisible();
    await mobile.close();

    // Construction last, so it does not change any earlier frame's state.
    const city = await getCity(page, token);
    await api(page, token, "post", `/cities/${city.id}/keep/upgrade`);
    // Wait until the authoritative queue actually reports the running job,
    // then let the client observe it — fail closed if it never appears.
    let running = false;
    for (let i = 0; i < 40; i++) {
      const q = (await api(page, token, "get", `/cities/${city.id}/queues`)) as {
        jobs?: { status: string; kind?: string; payload?: { slotIndex?: number } }[];
      };
      running = (q.jobs ?? []).some(
        (j) => j.status === "running" && j.kind === "build" && Number(j.payload?.slotIndex) === 0,
      );
      if (running) break;
      await page.waitForTimeout(250);
    }
    expect(running, "keep upgrade is not running on slot 0").toBe(true);
    await page.waitForTimeout(2000);
    await page.getByTestId("castle-scene").screenshot({ path: `${OUT}/after_construction_desktop.png` });
    await drain(page, token, city.id);
  });

  test("dragon roost: a living dragon inhabits the scene", async ({ page }) => {
    test.setTimeout(900_000);
    page.on("pageerror", (e) => console.log("[nsv2 pageerror]", e.message));
    const name = `DragonKeep ${Date.now() % 1000000}`;
    const token = await enterRealm(page, name);
    const { cityId } = await setupCapital(page, token, name);

    // Authoritative living-dragon inputs, then the real expedition flow.
    await grant(page, token, {
      dragonCounters: { camps: 10, scouts: 4, campTypes: ["camp_l2", "camp_l3"] },
      bestiaryEncounters: { shed_scale_phenomenon: 3, burned_farmland: 3, valley_drake: 3 },
      items: {
        dragon_material_1: 1, dragon_material_2: 1, dragon_material_3: 1,
        dragon_material_4: 1, dragon_material_5: 1,
      },
    });

    await page.getByRole("button", { name: "Knowledge", exact: true }).click();
    await page.getByText(/5\/5 requirements met/).waitFor({ timeout: 30_000 });
    await page.getByRole("button", { name: /Set out on the Dragon Expedition/ }).click({ force: true });
    await page.getByText(/Stage 1 of 4/).waitFor({ timeout: 30_000 });
    for (const stage of ["Investigate Tracks", "Clear the Raiders", "Reach the Scarred Site"]) {
      await page.getByRole("button", { name: stage }).click({ force: true });
    }
    await page.getByText(/Stage 4 of 4/).waitFor({ timeout: 30_000 });
    await page.getByTestId("face-the-scar").click({ force: true });
    await page.getByText(/The charter is earned/).waitFor({ timeout: 30_000 });

    await page.getByRole("button", { name: "Castle", exact: true }).click();
    await page.getByTestId("capital-roost").waitFor({ timeout: 20_000 });
    await page.getByLabel("Name").fill("Ashwake");
    await page.getByRole("button", { name: "Name the hatchling" }).click();
    await page.getByTestId("roost-name").getByText(/Ashwake/).waitFor({ timeout: 20_000 });
    await page.getByRole("button", { name: "Watch the roost" }).click();
    await page.waitForTimeout(2000);

    // Assert the authoritative roost fact before capturing.
    const living = (await api(page, token, "get", "/dragon/living")) as {
      dragons?: { kind: string; roostEmpty?: boolean; givenName?: string }[];
    };
    const signature = (living.dragons ?? []).find((d) => d.kind === "signature");
    expect(signature, "no signature dragon after the expedition").toBeTruthy();
    expect(signature!.roostEmpty).toBeFalsy();

    await openScene(page, token);
    await expect(page.getByTestId("scene-dragon")).toBeVisible();
    await page.getByTestId("castle-scene").screenshot({ path: `${OUT}/after_dragon_scene_desktop.png` });

    const mobile = await page.context().browser()!.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    await mobile.addInitScript((t) => localStorage.setItem("dragonwake_token", t), token);
    const mp = await mobile.newPage();
    await openScene(mp, token);
    await expect(mp.getByTestId("scene-dragon")).toBeVisible();
    await mp.getByTestId("castle-scene").screenshot({ path: `${OUT}/after_dragon_scene_mobile.png` });
    await mobile.close();
  });
});
