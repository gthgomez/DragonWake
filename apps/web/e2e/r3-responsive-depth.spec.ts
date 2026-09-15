import { test, expect, type Page } from "@playwright/test";

/**
 * R3 release-certification pass: responsive legibility with real assertions
 * (not screenshots alone) across the five main surfaces, plus the
 * wilderness replacement journey (claim → abandon → re-claim) that the
 * release debt names explicitly.
 */

const VIEWPORTS = [
  { width: 1280, height: 800, name: "desktop" },
  { width: 1024, height: 768, name: "tablet" },
  { width: 390, height: 844, name: "mobile" },
];

async function enterRealm(page: Page, suffix: string) {
  await page.goto("/");
  await page.getByLabel("Display name").fill(`Cert Lord ${suffix}`);
  await page.getByRole("button", { name: "Enter realm" }).click();
  await expect(page.getByRole("button", { name: "Castle", exact: true })).toBeVisible();
}

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "page must not scroll horizontally").toBeLessThanOrEqual(1);
}

test.describe.configure({ mode: "serial" });

for (const viewport of VIEWPORTS) {
  test(`cert ${viewport.name}: every main surface renders without horizontal overflow`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await enterRealm(page, `${viewport.name}-${Date.now() % 100000}`);

    const surfaces: Array<{ tab: string; probe: () => ReturnType<Page["getByText"]> | import("@playwright/test").Locator }> = [
      { tab: "Castle", probe: () => page.getByTestId("dragon-watch-panel") },
      { tab: "Lands", probe: () => page.getByText(/Lands|Estate|Plots|Stake/i).first() },
      { tab: "Realm", probe: () => page.getByRole("heading", { name: "The Realm" }) },
      { tab: "War", probe: () => page.getByText(/Dispatches|No active marches|reports/i).first() },
      { tab: "Knowledge", probe: () => page.getByRole("heading", { name: "The sky is not empty" }) },
      { tab: "Alliance", probe: () => page.getByText(/alliance/i).first() },
    ];

    for (const surface of surfaces) {
      await page.getByRole("button", { name: new RegExp(`^${surface.tab}`) }).click();
      const probe = surface.probe();
      await expect(probe).toBeVisible({ timeout: 15_000 });
      await assertNoHorizontalOverflow(page);
    }

    // Keep upgrade panel must state its exact costs (critic P2 fix).
    await page.getByRole("button", { name: "Castle", exact: true }).click();
    await expect(page.getByTestId("keep-upgrade-costs")).toContainText("Next level costs");
    await assertNoHorizontalOverflow(page);
  });
}

test("cert desktop: wilderness replacement — claim, abandon, re-claim", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await enterRealm(page, `wild-${Date.now() % 100000}`);

  // Grow enough settlers-at-arms for two claims (capacity 2 at Keep 1).
  // Unclaimed wilds are garrisoned (20xlevel levy + 5xlevel pikemen), so a
  // settlers-only march is a lost battle: train bowmen too.
  await page.getByRole("button", { name: /Agriculture/ }).click();
  await expect(page.getByText(/Agriculture: level 1/)).toBeVisible({ timeout: 20_000 });
  const trainUpTo = async (unit: string, minOwned: number, batch: number) => {
    const row = page.locator("li.muster-row", { hasText: unit });
    await expect(row).toBeVisible({ timeout: 20_000 });
    await expect
      .poll(async () => {
        const text = (await row.textContent()) ?? "";
        if (Number(/owned (\d+)/.exec(text)?.[1] ?? 0) >= minOwned) return true;
        await row.locator("input[type=number]").fill(String(batch));
        try {
          await row.getByRole("button", { name: "Train" }).click({ timeout: 2_000 });
        } catch {
          return false;
        }
        return false;
      }, { timeout: 90_000, intervals: [1_000, 2_000] })
      .toBe(true);
  };
  await trainUpTo("Levy Spearman", 45, 25);
  // bowmen need Archery 1 before their muster row will train
  await page.getByRole("button", { name: /^Archery/ }).click();
  await expect(page.getByText(/Archery: level 1/)).toBeVisible({ timeout: 20_000 });
  await trainUpTo("Bowman", 45, 25);

  // track the exact tile we claim — other actors' claimed wilds share the
  // "claimed" label, and only the player's own wild offers Abandon
  let claimedLabel = "";
  const claimWild = async () => {
    await page.getByRole("button", { name: "Realm", exact: true }).click();
    const wildTile = page.locator("button[aria-label*=', unclaimed, at ']").first();
    await expect(wildTile).toBeVisible({ timeout: 20_000 });
    claimedLabel =
      ((await wildTile.getAttribute("aria-label")) ?? "").replace(
        ", unclaimed,",
        ", claimed,",
      );
    await wildTile.click();
    await page.getByLabel("Levy Spearman count to send").fill("25");
    await page.getByLabel("Bowman count to send").fill("20");
    await page.getByRole("button", { name: "Claim for the realm (occupy)" }).click();
    await page.getByRole("button", { name: /Confirm — send the settlers-at-arms/ }).click();
    await page.getByRole("button", { name: /^War/ }).click();
    await expect(page.getByText(/Occupy wilderness/).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("No active marches")).toBeVisible({ timeout: 30_000 });
    // the headline alone also fits a lost battle — demand the victory
    await expect(page.getByText("Victory").first()).toBeVisible({ timeout: 30_000 });
    // and demand the honest postcondition: the tile really is ours now
    await page.getByRole("button", { name: "Realm", exact: true }).click();
    await expect(page.locator(`button[aria-label="${claimedLabel}"]`)).toBeVisible({
      timeout: 30_000,
    });
  };

  await claimWild();

  // Abandon from the realm panel, freeing capacity for the replacement claim.
  await page.getByRole("button", { name: "Realm", exact: true }).click();
  const claimedTile = page.locator(`button[aria-label="${claimedLabel}"]`);
  await expect(claimedTile).toBeVisible({ timeout: 20_000 });
  await claimedTile.click();
  // the panel refreshes map data on inspection; the control appears once
  // fresh ownership lands
  await page.getByTestId("abandon-wild").click({ timeout: 20_000 });
  await expect(page.getByText(/abandoned/i).first()).toBeVisible({ timeout: 20_000 });

  await claimWild();
});
