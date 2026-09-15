import { mkdirSync } from "node:fs";

import { test, expect, type Page } from "@playwright/test";

/**
 * AUDIT-REMEDIATION rendered verification.
 *
 * Product-lab rule: rendered player experience is an independent source of
 * truth, so these checks drive the running game and assert what a player can
 * actually perceive, not what the source claims. Each fix (F1–F7) is asserted
 * where the player meets it, and every state is captured under
 * /tmp/opencode/dw-fix/after for before/after comparison.
 *
 * The spec is self-contained: it enters a fresh guest per test and uses the
 * one dev fixture (POST /api/v1/admin/grant) only where a march would
 * otherwise be balance-gated — the same allowance the certified journey uses.
 */
const AFTER = process.env.DW_AFTER_DIR ?? "/tmp/opencode/dw-fix/after";
const API = (process.env.VITE_API_URL ?? "http://localhost:3001").replace(
  /\/$/,
  "",
);

mkdirSync(AFTER, { recursive: true });

async function enterGuest(page: Page, suffix: string) {
  await page.goto("/");
  await page.getByLabel("Display name").fill(`Audit Lord ${suffix}`);
  await page.getByRole("button", { name: "Enter realm" }).click();
  await expect(
    page.getByRole("button", { name: "Castle", exact: true }),
  ).toBeVisible();
}

async function shot(page: Page, name: string) {
  // Let the trailing toast/settle animations finish before capturing.
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${AFTER}/${name}.png` });
}

async function token(page: Page): Promise<string> {
  const t = await page.evaluate(() => localStorage.getItem("dragonwake_token"));
  if (!t) throw new Error("no auth token in localStorage");
  return t;
}

test.describe.configure({ mode: "serial" });

test("F2: the food ledger is a persistent HUD indicator on every tab", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await enterGuest(page, `hud-${Date.now() % 100000}`);

  const upkeep = page.getByTestId("upkeep-indicator");
  await expect(upkeep).toBeVisible();
  await expect(upkeep).toContainText(/Food \+\d/);
  await expect(upkeep).toContainText(/Upkeep −\d/);
  await expect(upkeep).toContainText(/Net [+−]\d/);
  await shot(page, "10-upkeep-hud");

  // The ledger must persist when the player leaves the Castle.
  await page.getByRole("button", { name: "Knowledge", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "The sky is not empty" }),
  ).toBeVisible();
  await expect(upkeep).toBeVisible();
  await expect(upkeep).toContainText(/Food \+\d/);
  await expect(upkeep).toContainText(/Net [+−]\d/);
});

test("F1/F7: the shop teaches the earn path and names both currencies", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await enterGuest(page, `shop-${Date.now() % 100000}`);

  const shop = page.getByTestId("shop-panel");
  await expect(shop).toBeVisible();
  await shop.locator("summary").click();

  const note = page.getByTestId("shop-earn-note");
  await expect(note).toBeVisible();
  await expect(note).toContainText(/earned, not bought/i);
  await expect(note).toContainText(/Daily Deeds/);
  await expect(note).toContainText(/Crownmarks/);

  // The earn-path control is real and points at the true Dracolith source.
  const earn = page.getByRole("button", { name: "Earn from Daily Deeds" });
  await expect(earn).toBeVisible();
  await shot(page, "11-shop-earnpath");

  const deeds = page.getByTestId("daily-deeds");
  await expect(deeds).toHaveCount(1);
  await earn.click();
  await expect(deeds).toBeInViewport();

  // Currency distinction also lands on the Castle resource rail.
  await expect(page.getByTestId("res-dracolith")).toBeVisible();
  await expect(page.getByTestId("res-dracolith")).toContainText(/Dracoliths/);
  // F6: research state is shown in place, not only as a toast.
  await expect(page.getByTestId("research-status")).toBeVisible();
});

test("F4: selecting a Realm tile surfaces the composer without manual scrolling", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await enterGuest(page, `realm-${Date.now() % 100000}`);
  const tok = await token(page);

  // Discover a low-level camp in the seeded realm so we can travel to a tile
  // the player could actually act on (no grant needed: this test asserts the
  // composer's discoverability, not a dispatch).
  const mapResp = await page.request.get(
    `${API}/api/v1/map/viewport?x0=0&y0=0&x1=39&y1=39`,
    { headers: { authorization: `Bearer ${tok}` } },
  );
  expect(mapResp.ok()).toBeTruthy();
  const world = (await mapResp.json()) as {
    camps: { id: string; x: number; y: number; level: number }[];
  };
  const camp = world.camps
    .filter((c) => c.level <= 2)
    .sort((a, b) => a.level - b.level)[0];
  expect(camp, "a low-level camp must exist in the seeded realm").toBeTruthy();

  await page.getByRole("button", { name: "Realm", exact: true }).click();
  await expect(page.getByRole("heading", { name: "The Realm" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Muster a March" }),
  ).toBeAttached();

  // Travel to the camp via the visible map-jump control (player path).
  await page.locator(".map-jump summary").click();
  const jump = page.locator(".map-jump form");
  await jump.getByLabel("X").fill(String(camp!.x));
  await jump.getByLabel("Y").fill(String(camp!.y));
  await jump.getByRole("button", { name: "Travel" }).click();
  await page.waitForTimeout(900);

  const tile = page
    .getByRole("button", {
      name: new RegExp(`level ${camp!.level}, at ${camp!.x}, ${camp!.y}`),
    })
    .first();
  await expect(tile).toBeVisible();
  await tile.click();

  // The orders panel and its composer must be on screen with no manual scroll.
  const orders = page.locator(".tile-detail.realm-orders");
  await expect(orders).toBeVisible();
  await expect(orders).toBeInViewport();
  const composer = page.locator(".realm-composer");
  await expect(composer).toBeInViewport();

  // Asserted numerically too: the composer's box intersects the viewport.
  const composerBox = await composer.boundingBox();
  expect(composerBox).not.toBeNull();
  expect(composerBox!.y).toBeLessThan(900);
  expect(composerBox!.y + composerBox!.height).toBeGreaterThan(0);

  await shot(page, "12-realm-composer");
});

test("F3: the notice rail is in-flow and never overlaps content", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await enterGuest(page, `toast-${Date.now() % 100000}`);

  const stack = page.getByTestId("toast-stack");

  // Structurally first in <main>: overlap with following content is impossible.
  const structure = await page.evaluate(() => {
    const el = document.querySelector<HTMLElement>(
      '[data-testid="toast-stack"]',
    );
    if (!el) return null;
    const style = getComputedStyle(el);
    return {
      isFirstChild: el.parentElement?.firstElementChild === el,
      position: style.position,
      pointerEvents: style.pointerEvents,
    };
  });
  expect(structure).not.toBeNull();
  expect(structure!.isFirstChild).toBe(true);
  expect(structure!.position).toBe("static");
  expect(structure!.pointerEvents).toBe("none");

  // Trigger a couple of real actions so the rail actually holds notices.
  await page
    .getByRole("button", { name: /^Infantry Doctrine/ })
    .first()
    .click({ force: true });
  const levyRow = page.locator("li.muster-row", { hasText: "Levy Spearman" });
  await levyRow.getByLabel("Levy Spearman count").fill("1");
  await levyRow.getByRole("button", { name: "Train", exact: true }).click();

  await expect(stack.locator('[data-testid="toast"]').first()).toBeVisible({
    timeout: 30_000,
  });

  // The rail lives at the top of <main>; the actions above auto-scrolled the
  // page, so return to the top where the rail and the content below it are
  // framed together. (The overlap assertion below is scroll-independent.)
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(120);

  const geometry = await page.evaluate(() => {
    const el = document.querySelector<HTMLElement>(
      '[data-testid="toast-stack"]',
    )!;
    const main = el.parentElement!;
    const rect = el.getBoundingClientRect();
    const following = [...main.children]
      .filter((child) => child !== el)
      .map((child) => {
        const r = child.getBoundingClientRect();
        return {
          cls: (child as HTMLElement).className,
          top: r.top,
          bottom: r.bottom,
          height: r.height,
        };
      })
      .filter((f) => f.height > 0)
      .sort((a, b) => a.top - b.top);
    const tutorial = document.querySelector<HTMLElement>(".hud-tutorial");
    const tutorialRect = tutorial?.getBoundingClientRect();
    return {
      stack: { top: rect.top, bottom: rect.bottom, height: rect.height },
      count: el.querySelectorAll('[data-testid="toast"]').length,
      declaredCount: Number(el.getAttribute("data-count") ?? "0"),
      toasts: [...el.querySelectorAll<HTMLElement>('[data-testid="toast"]')].map(
        (t) => ({
          text: (t.textContent ?? "").trim(),
          pointerEvents: getComputedStyle(t).pointerEvents,
        }),
      ),
      firstFollowing: following[0] ?? null,
      tutorial: tutorialRect
        ? { top: tutorialRect.top, bottom: tutorialRect.bottom }
        : null,
    };
  });

  expect(geometry.count).toBeGreaterThanOrEqual(1);
  expect(geometry.count).toBeLessThanOrEqual(3);
  expect(geometry.declaredCount).toBe(geometry.count);
  expect(geometry.toasts.every((t) => t.pointerEvents === "none")).toBe(true);
  expect(geometry.firstFollowing).not.toBeNull();
  // In-flow: the rail ends at or before the next content block begins.
  expect(geometry.stack.bottom).toBeLessThanOrEqual(
    geometry.firstFollowing!.top + 1,
  );
  // And explicitly versus the objective banner, which used to be obscured.
  if (geometry.tutorial) {
    expect(geometry.stack.bottom).toBeLessThanOrEqual(geometry.tutorial.top + 1);
  }

  await shot(page, "13-toasts-no-overlap");
});

test("F5: Alliance discovery handles empty/loading and renders a joined roster", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const suffix = `ally-${Date.now() % 100000}`;
  await enterGuest(page, suffix);
  const tok = await token(page);

  const listResp = await page.request.get(`${API}/api/v1/alliances`, {
    headers: { authorization: `Bearer ${tok}` },
  });
  expect(listResp.ok()).toBeTruthy();
  const ground = (await listResp.json()) as {
    alliances: { id: string; name: string; tag: string }[];
  };

  await page.getByRole("button", { name: "Alliance", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Alliance" })).toBeVisible();

  const empty = page.getByTestId("alliance-empty");
  const list = page.getByTestId("alliance-list");
  const refresh = page.getByTestId("alliance-refresh");

  // The loading placeholder must never be left stuck on screen.
  await expect(page.getByTestId("alliance-loading")).toBeHidden();
  await expect(refresh).toBeVisible();

  if (ground.alliances.length === 0) {
    // Fresh world: the empty state must teach how to found a banner.
    await expect(empty).toBeVisible();
    await expect(empty).toContainText(/No alliances have been founded yet/);
  } else {
    // Shared dev world (earlier specs already founded banners): discovery
    // must fall back to the real, joinable banner list.
    await expect(list).toBeVisible();
  }
  await shot(page, "14-alliance");

  if (ground.alliances.length > 0) {
    // The empty state is a contract of the view, not just of world state.
    // Stand in for a fresh realm by answering the discovery call with none,
    // assert the empty UI, then restore the real list.
    await page.route("**/api/v1/alliances", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ alliances: [] }),
      }),
    );
    await refresh.click();
    await expect(empty).toBeVisible();
    await expect(empty).toContainText(/No alliances have been founded yet/);
    await shot(page, "14c-alliance-empty");
    await page.unroute("**/api/v1/alliances");
    await refresh.click();
    await expect(list).toBeVisible();
  }

  // Swearing to a new banner must render the member roster (not just a count).
  // Tag is time-derived: the persistent dev DB keeps old banners, so a random
  // tag could collide and fail alliance creation on a later run.
  const tag = `V${Date.now().toString(36).slice(-4)}`.toUpperCase();
  await page
    .getByRole("textbox", { name: "Alliance name", exact: true })
    .fill(`Audit Banner ${suffix}`);
  await page
    .getByRole("textbox", { name: "Alliance tag", exact: true })
    .fill(tag);
  await page.getByRole("button", { name: "Create alliance" }).click();

  await expect(page.getByTestId("alliance-banner")).toBeVisible();
  await expect(page.getByTestId("alliance-roster")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByTestId("alliance-roster")).toContainText(
    new RegExp(suffix),
  );
  await expect(page.getByTestId("alliance-roster")).toContainText(/Leader/);
  await shot(page, "14b-alliance-roster");
});

test("mobile 390: Castle and Realm render without horizontal overflow", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await enterGuest(page, `mob-${Date.now() % 100000}`);

  const assertNoOverflow = async (label: string) => {
    const delta = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(delta, `${label} must not overflow horizontally`).toBeLessThanOrEqual(1);
  };

  await expect(page.getByTestId("upkeep-indicator")).toBeVisible();
  await assertNoOverflow("Castle");
  await shot(page, "15-mobile");

  await page.getByRole("button", { name: "Realm", exact: true }).click();
  await expect(page.getByRole("heading", { name: "The Realm" })).toBeVisible();
  await assertNoOverflow("Realm");
});

test("F6: a completed build renders an in-place result panel", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await enterGuest(page, `build-${Date.now() % 100000}`);

  // Raise Homes on an empty plot through the player's own build path. With the
  // dev-fast clock the queue finishes in well under a second; the result must
  // still land in the page (not only a transient toast).
  await page.getByRole("button", { name: "Empty plot 2" }).click();
  await page.locator(".city-pick", { hasText: "Homes" }).click();

  const result = page.getByTestId("city-build-result");
  await expect(result).toBeVisible({ timeout: 30_000 });
  await expect(result).toContainText(/Construction complete/i);
  await expect(result).toContainText(/Homes/);
  await shot(page, "16-build-result");
});

test("shop: buying the cheapest ware stocks it and using it consumes it", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await enterGuest(page, `wares-${Date.now() % 100000}`);
  const tok = await token(page);

  // Dracoliths are earned, never bought — the test realm tops them up by grant
  // so the purchase path can be exercised without a Deeds grind.
  const grant = await page.request.post(`${API}/api/v1/admin/grant`, {
    headers: { authorization: `Bearer ${tok}` },
    data: { dracolith: 100 },
  });
  expect(grant.ok()).toBeTruthy();

  const shop = page.getByTestId("shop-panel");
  await expect(shop).toBeVisible();
  await shop.locator("summary").click();

  // Relay Riders (speedup_1h) is the cheapest catalog ware.
  const cheapest = shop.getByTestId("shop-item-speedup_1h");
  await expect(cheapest).toContainText("Owned: 0");
  const buy = cheapest.getByRole("button", { name: "Buy", exact: true });
  // The granted balance reaches the shop through the /me poll.
  await expect(buy).toBeEnabled({ timeout: 15_000 });
  await buy.click();
  await expect(cheapest).toContainText("Owned: 1", { timeout: 15_000 });

  // The owned ware is listed with a Use action.
  const wares = shop.locator("ul.shop-inventory li.plot-row", {
    hasText: "Relay Riders",
  });
  await expect(wares).toBeVisible();

  // A speedup needs a running queue. Training is a real, long-running queue
  // (100 Levy Spearman ≈ 16s on the dev-fast clock), so start it before Use.
  const levyRow = page.locator("li.muster-row", { hasText: "Levy Spearman" });
  await levyRow.getByLabel("Levy Spearman count").fill("100");
  await levyRow.getByRole("button", { name: "Train", exact: true }).click();

  const use = wares.getByRole("button", { name: "Use", exact: true });
  await expect(use).toBeEnabled({ timeout: 15_000 });
  await use.click();

  // Consumed: it leaves "Your wares" and the catalog stock falls back to zero.
  await expect(wares).toHaveCount(0, { timeout: 15_000 });
  await expect(shop.getByText("You hold no wares yet.")).toBeVisible();
  await expect(cheapest).toContainText("Owned: 0");
  await shot(page, "17-shop-consumed");
});

test("F2: a host that out-eats the fields shows the upkeep warning", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await enterGuest(page, `hungry-${Date.now() % 100000}`);
  const tok = await token(page);

  // The fields yield 120 Food/h while the starting host eats 65/h. Negative
  // resource grants are rejected, so flip the net negative the player-legal
  // way: grant a host large enough to out-eat the fields without draining the
  // stores (upkeep 365/h vs production 120/h).
  const grant = await page.request.post(`${API}/api/v1/admin/grant`, {
    headers: { authorization: `Bearer ${tok}` },
    data: { units: { levy: 300 } },
  });
  expect(grant.ok()).toBeTruthy();

  // The /me poll updates the HUD within a couple of seconds.
  const upkeep = page.getByTestId("upkeep-indicator");
  await expect(upkeep).toContainText(/Net −/, { timeout: 15_000 });
  // Either the hard starvation banner or the soft negative-net note.
  await expect(
    page
      .getByTestId("upkeep-warning")
      .or(page.locator(".hud-upkeep-warning-soft")),
  ).toBeVisible({ timeout: 15_000 });
  await shot(page, "18-upkeep-negative");
});

test("latest-dispatch: a resolved march renders the result panel", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await enterGuest(page, `march-${Date.now() % 100000}`);
  const tok = await token(page);

  // Discover a low-level camp in the seeded realm (same path as F4).
  const mapResp = await page.request.get(
    `${API}/api/v1/map/viewport?x0=0&y0=0&x1=39&y1=39`,
    { headers: { authorization: `Bearer ${tok}` } },
  );
  expect(mapResp.ok()).toBeTruthy();
  const world = (await mapResp.json()) as {
    camps: { id: string; x: number; y: number; level: number }[];
  };
  const camp = world.camps
    .filter((c) => c.level <= 2)
    .sort((a, b) => a.level - b.level)[0];
  expect(camp, "a low-level camp must exist in the seeded realm").toBeTruthy();

  // The dev fixture tops up the host so a real march is sustainable; win or
  // lose, the resolution still raises a report.
  const grant = await page.request.post(`${API}/api/v1/admin/grant`, {
    headers: { authorization: `Bearer ${tok}` },
    data: { units: { levy: 300 } },
  });
  expect(grant.ok()).toBeTruthy();

  await page.getByRole("button", { name: "Realm", exact: true }).click();
  await expect(page.getByRole("heading", { name: "The Realm" })).toBeVisible();

  // Travel to the camp via the visible map-jump control (player path).
  await page.locator(".map-jump summary").click();
  const jump = page.locator(".map-jump form");
  await jump.getByLabel("X").fill(String(camp!.x));
  await jump.getByLabel("Y").fill(String(camp!.y));
  await jump.getByRole("button", { name: "Travel" }).click();
  await page.waitForTimeout(900);

  const tile = page
    .getByRole("button", {
      name: new RegExp(`level ${camp!.level}, at ${camp!.x}, ${camp!.y}`),
    })
    .first();
  await expect(tile).toBeVisible();
  await tile.click();

  // The granted host reaches the composer through the /me poll.
  const levyComp = page.locator(".comp-item", { hasText: "Levy Spearman" });
  await expect(levyComp).toContainText(/have 350/, { timeout: 15_000 });
  await page.getByLabel("Levy Spearman count to send").fill("300");
  await page
    .getByRole("button", { name: /Send attack \(\d+ marching\)/ })
    .click();
  await page
    .getByRole("button", { name: "Confirm — send the attack" })
    .click();

  // The report event drives the in-view latest-dispatch panel.
  const result = page.getByTestId("latest-dispatch");
  await expect(result).toBeVisible({ timeout: 90_000 });
  await expect(result).toContainText(/Latest dispatch/);
  await shot(page, "19-latest-dispatch");
});
