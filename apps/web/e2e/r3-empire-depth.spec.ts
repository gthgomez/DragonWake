import { expect, test } from "@playwright/test";

test.describe("R3 empire depth surfaces", () => {
  test("explains scale, operations, wildlands, and PvE bands in the player UI", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.getByLabel("Display name").fill(`R3 Surface ${Date.now() % 100000}`);
    await page.getByRole("button", { name: "Enter realm" }).click();

    await expect(page.getByRole("button", { name: "Castle", exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Keep progression" })).toContainText("Keep level 1");
    await expect(page.getByText(/Operations: 0 \/ 4/)).toBeVisible();
    await expect(page.getByText(/Troop capacity per march: 500/)).toBeVisible();
    await expect(page.getByText(/Wilderness holdings: 0 \/ 2/)).toBeVisible();

    await page.getByRole("button", { name: "Realm", exact: true }).click();
    await expect(page.getByRole("heading", { name: "The Realm" })).toBeVisible();
    await expect(page.locator('button[aria-label^="Bandit Camp"]').first()).toBeVisible();
  });
});
