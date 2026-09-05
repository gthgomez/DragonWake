import { test, expect, type Page } from "@playwright/test";

const OUT = "e2e/artifacts/alpha-r1";

async function shot(page: Page, name: string) {
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
}

async function enterRealm(page: Page, suffix: string) {
  await page.goto("/");
  await page.getByLabel("Display name").fill(`Alpha Lord ${suffix}`);
  await page.getByRole("button", { name: "Enter realm" }).click();
  await expect(page.getByRole("button", { name: "Castle", exact: true })).toBeVisible();
}

async function buildOnPlot(page: Page, plot: number, building: string) {
  const plotButton = page.getByRole("button", { name: `Empty plot ${plot}` });
  await plotButton.click();
  await expect(page.getByText("Choose a structure to raise here:")).toBeVisible();
  await page.locator(".city-pick", { hasText: building }).click();
  await expect(page.locator(".toast", { hasText: `Building ${building}` })).toBeVisible();
}

async function waitForBuilding(page: Page, label: RegExp) {
  await expect(page.getByRole("button", { name: label })).toBeVisible({ timeout: 20_000 });
}

async function research(page: Page, label: string, levelText: RegExp) {
  await page.getByRole("button", { name: new RegExp(`^${label}(?: ·|$)`) }).click();
  await expect(page.getByText(levelText)).toBeVisible({ timeout: 20_000 });
}

async function train(page: Page, unit: string, count: number) {
  const row = page.locator("li.muster-row", { hasText: unit });
  await row.locator("input[type=number]").fill(String(count));
  await row.getByRole("button", { name: "Train" }).click();
  await expect(row).toContainText(`owned ${count}`, { timeout: 20_000 });
}

async function waitForReport(page: Page, headline: string | RegExp) {
  await page.getByRole("button", { name: /^War/ }).click();
  await expect(page.getByText(headline).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("No active marches")).toBeVisible({ timeout: 30_000 });
}

async function ownedOf(row: ReturnType<Page["getByRole"]> | import("@playwright/test").Locator) {
  const text = (await row.textContent()) ?? "";
  return Number(/owned (\d+)/.exec(text)?.[1] ?? 0);
}

/** Retrain battle losses the way the objective log tells players to. */
async function topUp(page: Page, unit: string, minOwned: number) {
  await page.getByRole("button", { name: "Castle", exact: true }).click();
  const row = page.locator("li.muster-row", { hasText: unit }).first();
  await expect(row).toBeVisible({ timeout: 20_000 });
  await expect
    .poll(async () => {
      if ((await ownedOf(row)) >= minOwned) return true;
      // one batch per round; the click may be rejected while the realm is
      // broke or the queue is full — income (fast-time ticks) and finished
      // queues recover both, so wait and re-measure instead of throwing
      const fill = row.locator("input[type=number]");
      const train = row.getByRole("button", { name: "Train" });
      await fill.fill(String(minOwned - (await ownedOf(row))));
      try {
        await train.click({ timeout: 2_000 });
      } catch {
        return false;
      }
      return false;
    }, { timeout: 90_000, intervals: [1_000, 2_000] })
    .toBe(true);
}

async function selectFirstCamp(page: Page, level?: number) {
  const selector = level
    ? `button[aria-label^="Bandit Camp, level ${level}"]`
    : "button[aria-label^=\"Bandit Camp\"]";
  const troopInput = page.getByLabel("Levy Spearman count to send");
  await expect(page.locator(selector).first()).toBeVisible({ timeout: 20_000 });
  await expect
    .poll(async () => {
      // try on-screen tiles first: a force-click on a tile panned past the
      // viewport edge lands on whatever is topmost there and silently
      // selects nothing (or the wrong tile)
      const camps = page.locator(selector);
      const total = await camps.count();
      const vp = page.viewportSize() ?? { width: 0, height: 0 };
      const ordered: import("@playwright/test").Locator[] = [];
      for (let i = 0; i < total; i += 1) ordered.push(camps.nth(i));
      const inside: import("@playwright/test").Locator[] = [];
      const outside: import("@playwright/test").Locator[] = [];
      for (const tile of ordered) {
        const box = await tile.boundingBox();
        const onScreen =
          box !== null &&
          box.x >= 0 &&
          box.y >= 0 &&
          box.x + box.width <= vp.width &&
          box.y + box.height <= vp.height;
        (onScreen ? inside : outside).push(tile);
      }
      for (const tile of [...inside, ...outside]) {
        await tile.click({ force: true });
        if (await troopInput.isVisible()) return true;
      }
      return false;
    }, { timeout: 20_000, intervals: [100, 250, 500] })
    .toBe(true);
}

async function setMixedCompany(page: Page, levy = 50, bowman = 25) {
  await page.getByLabel("Levy Spearman count to send").fill(String(levy));
  await page.getByLabel("Bowman count to send").fill(String(bowman));
}

async function sendSelected(page: Page, first: string | RegExp, confirm: string | RegExp) {
  await page.getByRole("button", { name: first }).click();
  await page.getByRole("button", { name: confirm }).click();
}

test.describe.configure({ mode: "serial" });

test("alpha r1: complete the first kingdom-to-marcher-keep journey with player UI only", async ({ page }) => {
  // full journey including battle-loss retraining funded by in-game income
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await enterRealm(page, `${Date.now() % 100000}`);
  await expect(page.getByTestId("dragon-presence")).toContainText("Dormant");
  await shot(page, "01-kingdom-entered");

  await buildOnPlot(page, 2, "Homes");
  await waitForBuilding(page, /^Homes, level 1$/);
  await shot(page, "02-first-construction");

  await page.getByRole("button", { name: /^Homes, level 1$/ }).last().click();
  await page.getByRole("button", { name: /Improve to level 2/ }).click();
  await waitForBuilding(page, /^Homes, level 2$/);
  await shot(page, "03-upgraded-settlement");

  await page.getByRole("button", { name: "Lands", exact: true }).click();
  await page.getByRole("button", { name: "Unclaimed plot 0" }).click();
  await page.getByRole("button", { name: /Stake as/ }).click();
  await shot(page, "04-lands-improved");

  await page.getByRole("button", { name: "Castle", exact: true }).click();
  await research(page, "Archery", /Archery: level 1/);
  await research(page, "Dragon Studies", /Dragon Studies: level 1/);
  await research(page, "Dragon Studies", /Dragon Studies: level 2/);
  await train(page, "Bowman", 35);
  await shot(page, "05-researched-mixed-army");

  await buildOnPlot(page, 3, "Dragon Watch");
  await waitForBuilding(page, /^Dragon Watch, level 1$/);
  const dragonWatchTile = page.locator('button.city-tile[aria-label="Dragon Watch, level 1"]');
  await expect(dragonWatchTile).toHaveCount(1);
  const dragonWatchDetail = page.locator(".city-detail").getByRole("heading", { name: "Dragon Watch", exact: true });
  if (!(await dragonWatchDetail.isVisible().catch(() => false))) {
    await dragonWatchTile.click({ force: true });
  }
  await expect(dragonWatchDetail).toBeVisible();
  await page.locator(".city-detail").getByRole("button", { name: /Improve to level 2/ }).click();
  await waitForBuilding(page, /^Dragon Watch, level 2$/);
  await shot(page, "06-dragon-watch");

  // Camp-1 garrisons (<=50 levy, <=10 pikemen) are beaten decisively by the
  // trained company - combat sims put attacker losses at zero across seeds -
  // but the depth is kept as loss-tolerance: top-ups retrain battle losses
  // exactly as the objective log instructs ("muster more spearmen").
  await topUp(page, "Levy Spearman", 50);
  await topUp(page, "Bowman", 40);

  await page.getByRole("button", { name: "Realm", exact: true }).click();
  await expect(page.getByRole("heading", { name: "The Realm" })).toBeVisible();
  await selectFirstCamp(page, 1);
  await shot(page, "07-realm-target-selected");

  await setMixedCompany(page, 50, 35);
  await sendSelected(page, "Send scouts", /Confirm — send scouts/);
  await waitForReport(page, "Scouting dispatch");
  await shot(page, "08-scout-report");

  await page.getByRole("button", { name: "Realm", exact: true }).click();
  await selectFirstCamp(page, 1);
  await setMixedCompany(page, 50, 35);
  await sendSelected(page, /Send attack \(/, /Confirm — send the attack/);
  await waitForReport(page, "Camp attack");
  await expect(page.getByText("Victory").first()).toBeVisible();
  await page.getByRole("button", { name: "Castle", exact: true }).click();
  await expect(page.getByTestId("dragon-presence")).toContainText("Stirring");
  await shot(page, "09-battle-victory");

  // casualties are real: replenish between battles, exactly as the objective
  // log instructs ("muster more spearmen")
  for (let i = 0; i < 6; i += 1) {
    await topUp(page, "Levy Spearman", 50);
    await topUp(page, "Bowman", 40);
    await page.getByRole("button", { name: "Realm", exact: true }).click();
    await selectFirstCamp(page, i === 0 ? 2 : 1);
    await setMixedCompany(page, 50, 35);
    await sendSelected(page, /Send attack \(/, /Confirm — send the attack/);
    await waitForReport(page, "Camp attack");
    await expect(page.getByText("Victory").first()).toBeVisible();
  }

  await topUp(page, "Levy Spearman", 50);
  await topUp(page, "Bowman", 40);

  await page.getByRole("button", { name: "Realm", exact: true }).click();
  const wild = page.locator("button[aria-label$=\", unclaimed, at 0, 0\"]").first();
  const anyWild = page.locator("button[aria-label*=', unclaimed, at ']").first();
  const wildTile = (await wild.count()) > 0 ? wild : anyWild;
  await expect(wildTile).toBeVisible({ timeout: 20_000 });
  await wildTile.click();
  await setMixedCompany(page, 20, 10);
  await sendSelected(page, /Claim for the realm|Claim for the realm/, /Confirm — send the settlers-at-arms/);
  await waitForReport(page, "Occupy wilderness");
  await shot(page, "10-claimed-wilderness");

  await page.getByRole("button", { name: "Knowledge", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Evidence in the keep" })).toBeVisible();
  await expect(page.getByText(/Shed scale|Burned livestock|Claw marks/i).first()).toBeVisible();
  await shot(page, "11-first-dragon-clue");
  await expect(page.getByText(/Dragon Watch.*readiness 2\/2|requirements met/).first()).toBeVisible();
  await shot(page, "12-dragon-readiness");

  await page.getByRole("button", { name: "Set out on the Dragon Expedition" }).click();
  await expect(page.getByText(/Stage 1 of/)).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Castle", exact: true }).click();
  await expect(page.getByTestId("dragon-presence")).toContainText("Awakened");
  await page.getByRole("button", { name: "Knowledge", exact: true }).click();
  await page.getByRole("button", { name: "Investigate Tracks" }).click();
  await expect(page.getByText(/Stage 2 of/)).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Clear the Raiders" }).click();
  await expect(page.getByText(/Stage 3 of/)).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Reach the Scarred Site" }).click();
  await expect(page.getByText(/Stage 4 of/)).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("face-the-scar").click();
  await expect(page.getByText(/charter is earned/i)).toBeVisible({ timeout: 20_000 });
  await shot(page, "13-expedition-charter");

  await page.getByRole("button", { name: "Castle", exact: true }).click();
  await page.getByRole("button", { name: "Review the founding" }).click();
  await page.getByRole("button", { name: "Found the Marcher Keep" }).click();
  await expect(page.getByText(/Marcher Keep stands/i)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("dragon-presence")).toContainText("Frontier charter");
  await shot(page, "14-marcher-keep-founded");
  const settlementPicker = page.locator(".castle-city-picker select");
  await expect(settlementPicker).toBeVisible();
  await settlementPicker.selectOption({ label: "Marcher Keep — Marcher Keep" });
  await expect(page.getByText(/Forward march/i)).toBeVisible();
});

for (const viewport of [
  { width: 1024, height: 768, name: "tablet" },
  { width: 390, height: 844, name: "mobile" },
]) {
  test(`alpha r1: ${viewport.name} surface remains legible`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await enterRealm(page, `${viewport.name}-${Date.now() % 100000}`);
    await expect(page.getByTestId("dragon-watch-panel")).toBeVisible();
    await shot(page, `responsive-${viewport.name}-castle`);
    await page.getByRole("button", { name: "Realm", exact: true }).click();
    await expect(page.getByRole("heading", { name: "The Realm" })).toBeVisible();
    await shot(page, `responsive-${viewport.name}-realm`);
    await page.getByRole("button", { name: "Knowledge", exact: true }).click();
    await expect(page.getByRole("heading", { name: "The sky is not empty" })).toBeVisible();
    await shot(page, `responsive-${viewport.name}-knowledge`);
  });
}
