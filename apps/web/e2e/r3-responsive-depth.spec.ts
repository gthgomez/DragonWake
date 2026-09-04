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
  await page.getByRole("button", { name: /Agriculture/ }).click();
  await expect(page.getByText(/Agriculture: level 1/)).toBeVisible({ timeout: 20_000 });
  const musterRow = page.locator("li.muster-row", { hasText: "Levy Spearman" });
  await musterRow.locator("input[type=number]").fill("60");
  await musterRow.getByRole("button", { name: "Train" }).click();
  await expect
    .poll(async () => {
      const text = (await musterRow.textContent()) ?? "";
      return Number(/owned (\d+)/.exec(text)?.[1] ?? 0);
    }, { timeout: 30_000, intervals: [500, 1_000] })
    .toBeGreaterThanOrEqual(100);

  const claimWild = async () => {
    await page.getByRole("button", { name: "Realm", exact: true }).click();
    const wildTile = page.locator("button[aria-label*=', unclaimed, at ']").first();
    await expect(wildTile).toBeVisible({ timeout: 20_000 });
    await wildTile.click();
    await page.getByLabel("Levy Spearman count to send").fill("20");
    await page.getByRole("button", { name: "Claim for the realm (occupy)" }).click();
    await page.getByRole("button", { name: /Confirm — send the settlers-at-arms/ }).click();
    await page.getByRole("button", { name: /^War/ }).click();
    await expect(page.getByText(/Occupy wilderness/).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("No active marches")).toBeVisible({ timeout: 30_000 });
  };

  await claimWild();

  // Abandon from the realm panel, freeing capacity for the replacement claim.
  await page.getByRole("button", { name: "Realm", exact: true }).click();
  // the leading comma keeps this from matching "…, unclaimed, at …" tiles
  const claimedTile = page.locator("button[aria-label*=', claimed, at']").first();
  await expect(claimedTile).toBeVisible({ timeout: 20_000 });
  await claimedTile.click();
  await page.getByTestId("abandon-wild").click();
  await expect(page.getByText(/abandoned/i).first()).toBeVisible({ timeout: 20_000 });

  await claimWild();
});
