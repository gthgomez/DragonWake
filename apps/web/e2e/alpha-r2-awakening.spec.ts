import { expect, test } from "@playwright/test";

test.describe("Alpha R2 awakening", () => {
  test("shows Dragon Presence in the first kingdom session", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Display name").fill("R2 Witness");
    await page.getByRole("button", { name: "Enter realm" }).click();

    await expect(page.getByTestId("dragon-presence")).toBeVisible();
    await expect(page.getByText("Dormant", { exact: true })).toBeVisible();
    await expect(
      page.getByText(/Build the Dragon Watch and bring back your first sign/),
    ).toBeVisible();
  });
});
