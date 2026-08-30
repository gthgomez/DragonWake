import { test, expect } from "@playwright/test";

/**
 * CLOSED_MOCKUP_V1 certification journey.
 * Every player action below is a real, server-backed action. The single
 * dev fixture (POST /admin/grant) is used only to bypass RNG-gated /
 * farm-time gates (dragon materials, cumulative counters) exactly as the
 * campaign brief permits; the gates themselves are server-verified.
 */
const OUT = "e2e/artifacts/closed-mockup-v1";
const API = process.env.VITE_API_URL ?? "http://localhost:3001";

test("CLOSED_MOCKUP_V1 journey", async ({ page }) => {
  test.setTimeout(420_000);
  const playerName = `Cert Lord ${Date.now() % 100000}`;

  const shot = async (name: string) => {
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${OUT}/${name}.png` });
  };
  const apiBase = API.replace(/\/$/, "");

  // 1. enter the kingdom
  await page.goto("/");
  await page.getByLabel("Display name").fill(playerName);
  await page.getByRole("button", { name: "Enter realm" }).click();
  await expect(
    page.getByRole("button", { name: "Castle", exact: true }),
  ).toBeVisible();
  await shot("01-entered-kingdom");

  // 2. build a structure on an empty plot
  await page.getByRole("button", { name: "Empty plot 2" }).click();
  await page.locator(".city-pick", { hasText: "Homes" }).click();
  await expect(page.getByText("Construction complete: Homes").first()).toBeVisible({
    timeout: 30_000,
  });

  // 3. upgrade it: the level must rise, not duplicate
  await page.getByRole("button", { name: /^Homes, level 1/ }).first().click();
  await expect(
    page.getByText("Now: Houses 100 additional townsfolk"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Improve to level 2/ })
    .click({ force: true });
  await expect(
    page.getByRole("button", { name: /^Homes, level 2/ }).first(),
  ).toBeVisible({ timeout: 30_000 });
  await shot("03-homes-upgraded");

  // 4. stake farmland in the Lands
  await page.getByRole("button", { name: "Lands", exact: true }).click();
  await page.getByRole("button", { name: "Unclaimed plot 0" }).click();
  await page
    .getByRole("button", { name: /Stake as Farmland/ })
    .click({ force: true });
  await expect(page.getByText("New plot staked").first()).toBeVisible();
  await shot("04-lands-staked");

  // 5. research Infantry Doctrine
  await page.getByRole("button", { name: "Castle", exact: true }).click();
  await page
    .getByRole("button", { name: /^Infantry Doctrine/ })
    .click({ force: true });
  await expect(
    page.getByText(/Research complete: Infantry Doctrine/).first(),
  ).toBeVisible({ timeout: 30_000 });

  // 6. muster additional spearmen (verify the stack, not the toast)
  const levyRow = page.locator(".muster-row", { hasText: "Levy Spearman" });
  await levyRow.getByLabel("Levy Spearman count").fill("15");
  await levyRow.getByRole("button", { name: "Train", exact: true }).click();
  await expect(levyRow.getByText("owned 65")).toBeVisible({ timeout: 60_000 });
  await shot("06-troops-trained");

  // 7. realm: navigate by travel, scout a camp
  const token0 = await page.evaluate(() =>
    localStorage.getItem("tideforge_token"),
  );
  const mapResp = await page.request.get(
    `${apiBase}/api/v1/map/viewport?x0=0&y0=0&x1=39&y1=39`,
    { headers: { authorization: `Bearer ${token0}` } },
  );
  const worldMap = (await mapResp.json()) as {
    camps: { id: string; x: number; y: number; level: number }[];
    wilderness: {
      id: string;
      x: number;
      y: number;
      level: number;
      ownerPlayerId: string | null;
    }[];
  };
  const camp = worldMap.camps
    .filter((c) => c.level <= 2)
    .sort((a, b) => a.level - b.level)[0]!;
  const unclaimedWild = worldMap.wilderness.find((w) => !w.ownerPlayerId)!;

  const travelTo = async (x: number, y: number) => {
    await page.locator(".map-jump summary").click();
    const form = page.locator(".map-jump form");
    await form.getByLabel("X").fill(String(x));
    await form.getByLabel("Y").fill(String(y));
    await form.getByRole("button", { name: "Travel" }).click();
    await page.waitForTimeout(700);
    await page.locator(".map-jump summary").click();
  };

  await page.getByRole("button", { name: "Realm", exact: true }).click();
  await travelTo(camp.x, camp.y);
  const campTile = page
    .getByRole("button", {
      name: new RegExp(`Bandit Camp, level ${camp.level}, at ${camp.x}, ${camp.y}`),
    })
    .first();
  await expect(campTile).toBeVisible();
  await campTile.click();
  await expect(page.getByText(/Bandit Camp . level/)).toBeVisible();
  await shot("07-camp-selected");

  const scoutsInput = page.getByLabel("Scout count to send");
  await scoutsInput.fill("5");
  await page
    .getByRole("button", { name: /Send scouts/ })
    .first()
    .click({ force: true });
  await page
    .getByRole("button", { name: /Confirm . send scouts/ })
    .click({ force: true });
  await expect(page.getByText("No active marches")).toBeVisible({
    timeout: 90_000,
  });
  await page.getByRole("button", { name: /^War/ }).click();
  await expect(page.getByText("Scouting dispatch")).toBeVisible();
  await shot("07b-scout-dispatch");

  // 8. attack the camp with real troops
  // Top up the muster via the dev fixture so three real battles are
  // sustainable within the journey's timeframe.
  const tokenPre = await page.evaluate(() =>
    localStorage.getItem("tideforge_token"),
  );
  await page.request.post(`${apiBase}/api/v1/admin/grant`, {
    headers: { authorization: `Bearer ${tokenPre}` },
    data: { units: { levy: 200, bowman: 100 } },
  });
  await page.waitForTimeout(2500);
  const sendAllLevy = () =>
    page.getByLabel("Levy Spearman count to send").fill("999");
  const attackCamp = async () => {
    await page.getByRole("button", { name: "Realm", exact: true }).click();
    await campTile.click();
    // clear any earlier selection (e.g. scouts lost in battle)
    const clearBtn = page.getByRole("button", { name: "Clear", exact: true });
    if (await clearBtn.isVisible().catch(() => false)) {
      await clearBtn.click({ force: true });
    }
    await sendAllLevy();
    await page
      .getByRole("button", { name: /Send attack \(\d+ marching\)/ })
      .click({ force: true });
    await page
      .getByRole("button", { name: /Confirm . send the attack/ })
      .click({ force: true });
    await expect(page.getByText("No active marches")).toBeVisible({
      timeout: 90_000,
    });
  };

  await attackCamp();
  await page.getByRole("button", { name: /^War/ }).click();
  await expect(page.getByText(/Victory|Defeat/).first()).toBeVisible();
  await shot("08-battle-report");

  // 9. two more camp victories -> the Bestiary records a creature-sign
  await attackCamp();
  await attackCamp();
  await page.getByRole("button", { name: "Knowledge", exact: true }).click();
  await expect(page.getByText(/Claw Marks on Stone/).first()).toBeVisible();
  await shot("09-bestiary-recording");

  // 10. claim a wilderness and see the economy respond
  await page.getByRole("button", { name: "Realm", exact: true }).click();
  await travelTo(unclaimedWild.x, unclaimedWild.y);
  const wildTile = page
    .getByRole("button", {
      name: new RegExp(`unclaimed, at ${unclaimedWild.x}, ${unclaimedWild.y}`),
    })
    .first();
  await expect(wildTile).toBeVisible();
  await wildTile.click();
  const claimButton = page.getByRole("button", {
    name: /Claim for the realm/,
  });
  await expect(claimButton).toBeVisible();
  await sendAllLevy();
  await claimButton.click({ force: true });
  await page
    .getByRole("button", { name: /Confirm . send the settlers-at-arms/ })
    .click({ force: true });
  await expect(page.getByText("No active marches")).toBeVisible({
    timeout: 90_000,
  });
  await page.getByRole("button", { name: "Castle", exact: true }).click();
  await expect(page.getByText(/Held wildlands: 1/)).toBeVisible();
  await shot("10-wilderness-held");

  // 11. fixture the RNG-gated readiness inputs (dev grant)
  const token = await page.evaluate(() =>
    localStorage.getItem("tideforge_token"),
  );
  const grant = await page.request.post(`${apiBase}/api/v1/admin/grant`, {
    headers: { authorization: `Bearer ${token}` },
    data: {
      dragonCounters: {
        camps: 10,
        scouts: 4,
        campTypes: ["camp_l2", "camp_l3"],
      },
      bestiaryEncounters: {
        shed_scale_phenomenon: 3,
        burned_farmland: 3,
        valley_drake: 3,
      },
      items: {
        dragon_material_1: 1,
        dragon_material_2: 1,
        dragon_material_3: 1,
        dragon_material_4: 1,
        dragon_material_5: 1,
      },
    },
  });
  expect(grant.ok()).toBeTruthy();

  // Dragon Studies to level 2 via real research
  await page
    .getByRole("button", { name: /^Dragon Studies/ })
    .click({ force: true });
  await expect(
    page.getByText(/Research complete: Dragon Studies/).first(),
  ).toBeVisible({ timeout: 30_000 });
  await page
    .getByRole("button", { name: /^Dragon Studies/ })
    .click({ force: true });
  await expect(
    page.getByText(/Research complete: Dragon Studies/).nth(1),
  ).toBeVisible({ timeout: 30_000 });

  // 12. the dragon expedition, staged
  await page.getByRole("button", { name: "Knowledge", exact: true }).click();
  await expect(page.getByText(/4\/4 requirements met/)).toBeVisible();
  await page
    .getByRole("button", { name: /Set out on the Dragon Expedition/ })
    .click({ force: true });
  await expect(page.getByText(/Stage 1 of 4/)).toBeVisible();
  await shot("12-expedition-begins");
  for (const stage of [1, 2, 3, 4]) {
    await page
      .getByRole("button", { name: "Accomplish this stage" })
      .click({ force: true });
    if (stage < 4) {
      await expect(
        page.getByText(new RegExp(`Stage ${stage + 1} of 4`)),
      ).toBeVisible();
    } else {
      await expect(page.getByText(/The charter is earned/)).toBeVisible();
    }
  }
  await shot("12b-charter-earned");

  // 13. found the Marcher Keep from the Castle
  await page.getByRole("button", { name: "Castle", exact: true }).click();
  await page.getByRole("button", { name: "Review the founding" }).click();
  await page
    .getByRole("button", { name: /Found the Marcher Keep/ })
    .click({ force: true });
  await expect(page.getByText("Marcher Keep founded").first()).toBeVisible({
    timeout: 30_000,
  });
  await shot("13-keep-founded");

  // 14. switch to the keep; it is its own place
  await page.getByLabel("Settlements").selectOption({ index: 1 });
  await expect(page.getByText(/Forward march\./)).toBeVisible();
  await expect(page.getByText(/Marcher Keep/).first()).toBeVisible();
  await shot("14-marcher-keep");

  // 15. the objective ladder closed itself out
  await expect(page.getByText("All objectives complete").first()).toBeVisible();
  await shot("15-journey-complete");
});
