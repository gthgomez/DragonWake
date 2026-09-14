import { expect, test } from "@playwright/test";

test.describe("Alpha R2 awakening", () => {
  test("shows Dragon Presence in the first kingdom session", async ({ page }) => {
    await page.goto("/");
    // Run-unique: the persistent dev DB rejects a display name already sworn
    // by another lord, so a hardcoded name fails on the second run.
    await page.getByLabel("Display name").fill(`R2 Witness ${Date.now() % 100000}`);
    await page.getByRole("button", { name: "Enter realm" }).click();

    await expect(page.getByTestId("dragon-presence")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Dormant" })).toBeVisible();
    await expect(
      page.getByText(/Build the Dragon Watch and bring back your first sign/),
    ).toBeVisible();
  });
});
