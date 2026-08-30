import { test, expect, Page } from "@playwright/test";

const OUT = "e2e/artifacts/campaign-r1";

async function shot(page: Page, name: string) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
}

test("campaign r1: capture reworked surfaces", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByLabel("Display name").fill(`QA Lord ${Date.now() % 10000}`);
  await page.getByRole("button", { name: "Enter realm" }).click();
  await expect(page.getByRole("button", { name: "Realm", exact: true })).toBeVisible();
  await shot(page, "01-castle-top");

  // Select an occupied plot (Homes at slot 1) → detail panel
  await page.getByRole("button", { name: /^Homes, level 1/ }).click();
  await shot(page, "02-castle-plot-detail");

  // Select an empty plot → build cards
  await page.getByRole("button", { name: "Empty plot 2" }).click();
  await shot(page, "03-castle-build-cards");

  // Queue a Barracks on empty plot 3
  await page.getByRole("button", { name: "Empty plot 3" }).click();
  await page.locator(".city-pick", { hasText: "Barracks" }).click();
  await page.waitForTimeout(700);
  await shot(page, "04-castle-construction");

  // Lands
  await page.getByRole("button", { name: "Lands", exact: true }).click();
  await shot(page, "05-lands");
  await page.getByRole("button", { name: "Unclaimed plot 0" }).click();
  await shot(page, "06-lands-plot-detail");

  // Realm
  await page.getByRole("button", { name: "Realm", exact: true }).click();
  await page.waitForTimeout(1200);
  await shot(page, "07-realm");

  // select camp tile
  const campTile = page.getByRole("button", { name: /Bandit Camp, level \d+ at/ }).first();
  if (await campTile.count()) {
    await campTile.click();
    await shot(page, "08-realm-camp-selected");
  }

  // Knowledge
  await page.getByRole("button", { name: "Knowledge", exact: true }).click();
  await shot(page, "09-knowledge");

  // mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Castle", exact: true }).click();
  await shot(page, "10-castle-mobile");
  await page.getByRole("button", { name: "Realm", exact: true }).click();
  await page.waitForTimeout(800);
  await shot(page, "11-realm-mobile");
});
