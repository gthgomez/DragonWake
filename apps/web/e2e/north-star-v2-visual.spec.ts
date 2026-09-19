import { test, expect, type Page } from "@playwright/test";

/**
 * North Star V2 — Castle settlement visual convergence.
 *
 * Class A evidence generation (per docs/product/VISUAL_QA_STRATEGY.md): it
 * reproduces a representative capital through REAL authoritative state and
 * captures the rendered product. It is not a pixel-perfect Class B test.
 *
 * Run: pnpm --filter @dragonwake/web e2e north-star-v2-visual
 * Output: apps/web/e2e/artifacts/north-star-v2/ (untracked raw captures)
 */
const OUT = "e2e/artifacts/north-star-v2";
const API = process.env.VITE_API_URL ?? "http://localhost:3001";

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

async function api(page: Page, token: string, method: "get" | "post", path: string, data?: unknown) {
  const res = await page.request[method](`${API}/api/v1${path}`, {
    headers: { authorization: `Bearer ${token}` },
    data,
  });
  if (!res.ok()) throw new Error(`${method} ${path} -> ${res.status()} ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function drain(page: Page, token: string, cityId: string) {
  for (let i = 0; i < 200; i++) {
    const q = (await api(page, token, "get", `/cities/${cityId}/queues`)) as { jobs?: { status: string }[] };
    if (!(q.jobs ?? []).some((j) => j.status === "running")) return;
    await page.waitForTimeout(600);
  }
}

async function enterRealm(page: Page, name: string): Promise<string> {
  await page.goto("/");
  await page.getByLabel("Display name").fill(name);
  await page.getByRole("button", { name: "Enter realm" }).click();
  await page.getByRole("button", { name: "Castle", exact: true }).waitFor({ timeout: 20_000 });
  return (await page.evaluate(() => localStorage.getItem("dragonwake_token")))!;
}

async function buildToLevel(page: Page, token: string, cityId: string, slot: number, type: string, level: number) {
  for (let i = 0; i < level; i++) {
    await api(page, token, "post", `/cities/${cityId}/buildings`, { slotIndex: slot, buildingType: type });
    await drain(page, token, cityId);
  }
}

test.describe("North Star V2 — Castle settlement", () => {
  test("reference captures: default desktop / selected / construction / mobile", async ({ page }) => {
    test.setTimeout(600_000);
    page.on("pageerror", (e) => console.log("[nsv2 pageerror]", e.message));
    page.on("console", (m) => { if (m.type() === "error") console.log("[nsv2 console]", m.text().slice(0, 200)); });
    const token = await enterRealm(page, `NorthStar ${Date.now() % 1000000}`);
    const me = (await api(page, token, "get", "/me")) as { cities: { id: string }[] };
    const cityId = me.cities[0]!.id;

    await api(page, token, "post", "/admin/grant", {
      resources: { food: 5_000_000, wood: 5_000_000, stone: 5_000_000, ore: 5_000_000, crownmark: 5_000_000 },
    });
    for (let i = 0; i < 7; i++) {
      try { await api(page, token, "post", `/cities/${cityId}/keep/upgrade`); await drain(page, token, cityId); } catch { break; }
    }
    // Dragon Watch is a real progression facility gated on Dragon Studies.
    for (let i = 0; i < 2; i++) {
      try { await api(page, token, "post", `/cities/${cityId}/research`, { techId: "dragon_studies" }); await drain(page, token, cityId); } catch { break; }
    }
    for (const [slot, type, level] of BUILD_PLAN) {
      try { await buildToLevel(page, token, cityId, slot, type, level); } catch { /* keep going */ }
    }

    // Fresh load so the capture reflects the authoritative state, not the
    // transient session that built it.
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Castle", exact: true }).waitFor({ timeout: 30_000 });
    await page.getByTestId("castle-scene").scrollIntoViewIfNeeded();
    await page.waitForTimeout(6000);

    await page.screenshot({ path: `${OUT}/after_desktop.png`, fullPage: true });
    await page.getByTestId("castle-scene").screenshot({ path: `${OUT}/after_scene_desktop.png` });

    // Selected structure detail
    await page.getByRole("button", { name: /^Homes, level/ }).first().click({ force: true });
    await page.waitForTimeout(800);
    await page.getByTestId("castle-scene").screenshot({ path: `${OUT}/after_building-selected_desktop.png` });

    // Construction presentation: a real keep-upgrade job targets slot 0 and
    // runs long enough under dev pacing to be observed in the world.
    await api(page, token, "post", `/cities/${cityId}/keep/upgrade`).catch(() => {});
    await page.waitForTimeout(500);
    await page.getByTestId("castle-scene").screenshot({ path: `${OUT}/after_construction_desktop.png` });
    await drain(page, token, cityId);

    // Mobile must remain the same world, pannable, with usable targets.
    const mobile = await page.context().browser()!.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    await mobile.addInitScript((t) => localStorage.setItem("dragonwake_token", t), token);
    const mp = await mobile.newPage();
    await mp.goto("/", { waitUntil: "domcontentloaded" });
    await mp.getByRole("button", { name: "Castle", exact: true }).waitFor();
    await mp.getByTestId("castle-scene").scrollIntoViewIfNeeded();
    await mp.waitForTimeout(6000);
    await mp.screenshot({ path: `${OUT}/after_mobile.png`, fullPage: true });
    await mp.getByTestId("castle-scene").screenshot({ path: `${OUT}/after_scene_mobile.png` });

    // The scene is the interaction surface: a structure is still selectable.
    await mp.getByRole("button", { name: /^Barracks, level 4/ }).first().click({ force: true });
    await expect(mp.locator(".city-detail").getByRole("heading", { name: "Barracks", exact: true })).toBeVisible();
    await mobile.close();
  });
});
