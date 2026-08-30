import { test, expect, Page } from "@playwright/test";

const OUT = "e2e/artifacts/baseline";

async function shot(page: Page, name: string) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
}

async function createGuest(page: Page, name: string, factionIndex: number) {
  await page.goto("/");
  await page.getByLabel("Display name").fill(name);
  await page.getByLabel("Faction").selectOption({ index: factionIndex });
  await page.getByRole("button", { name: "Enter realm" }).click();
  await expect(page.getByRole("button", { name: "Realm" })).toBeVisible();
}

test("baseline: capture current app state", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  // login
  await page.goto("/");
  await expect(page.getByText("Create guest")).toBeVisible();
  await shot(page, "01-login-desktop");

  await createGuest(page, `Baseline Lord ${Date.now() % 10000}`, 0);

  // castle
  await expect(page.getByText("Resources")).toBeVisible();
  await shot(page, "02-castle-desktop");

  // lands
  await page.getByRole("button", { name: "Lands" }).click();
  await shot(page, "03-lands-desktop");

  // realm
  await page.getByRole("button", { name: "Realm" }).click();
  await page.waitForTimeout(1200);
  await shot(page, "04-realm-desktop");

  // war
  await page.getByRole("button", { name: "War" }).click();
  await shot(page, "05-war-desktop");

  // knowledge
  await page.getByRole("button", { name: "Knowledge" }).click();
  await shot(page, "06-knowledge-desktop");

  // alliance
  await page.getByRole("button", { name: "Alliance" }).click();
  await shot(page, "07-alliance-desktop");

  // settings
  await page.getByRole("button", { name: "Settings" }).click();
  await shot(page, "08-settings-desktop");

  // mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Castle" }).click();
  await shot(page, "09-castle-mobile");

  await page.getByRole("button", { name: "Realm" }).click();
  await page.waitForTimeout(1000);
  await shot(page, "10-realm-mobile");

  await page.getByRole("button", { name: "Knowledge" }).click();
  await shot(page, "11-knowledge-mobile");
});
