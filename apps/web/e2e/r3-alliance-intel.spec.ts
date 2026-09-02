import { expect, test } from "@playwright/test";

test.describe("R3 alliance coordination", () => {
  test("shows shared scout intelligence to an allied player", async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    try {
      const guest = async (page: typeof pageA, name: string, faction: string) => {
        const response = await page.request.post("/api/v1/auth/guest", {
          data: { displayName: name, faction },
        });
        expect(response.ok()).toBe(true);
        return (await response.json()) as {
          token: string;
          city: { id: string; mapX: number; mapY: number };
        };
      };
      const a = await guest(pageA, `Intel Sender ${Date.now() % 100000}`, "northern_kingdom");
      const b = await guest(pageB, `Intel Receiver ${Date.now() % 100000}`, "mountain_realm");
      const allianceResponse = await pageA.request.post("/api/v1/alliances", {
        headers: { Authorization: `Bearer ${a.token}` },
        data: { name: "Browser Watch", tag: `BW${Date.now() % 100}` },
      });
      expect(allianceResponse.ok()).toBe(true);
      const alliance = (await allianceResponse.json()) as { alliance: { id: string } };
      const join = await pageB.request.post(`/api/v1/alliances/${alliance.alliance.id}/join`, {
        headers: { Authorization: `Bearer ${b.token}` },
      });
      expect(join.ok()).toBe(true);
      const grant = await pageA.request.post("/api/v1/admin/grant", {
        headers: { Authorization: `Bearer ${a.token}` },
        data: { units: { scout: 1 } },
      });
      expect(grant.ok()).toBe(true);
      const viewport = await pageA.request.get("/api/v1/map/viewport?x0=0&y0=0&x1=39&y1=39", {
        headers: { Authorization: `Bearer ${a.token}` },
      });
      const map = (await viewport.json()) as { camps: Array<{ id: string; x: number; y: number }> };
      const camp = map.camps[0]!;
      const marchResponse = await pageA.request.post("/api/v1/marches", {
        headers: { Authorization: `Bearer ${a.token}` },
        data: {
          fromCityId: a.city.id,
          intent: "scout",
          target: { type: "camp", id: camp.id, x: camp.x, y: camp.y },
          composition: { scout: 1 },
        },
      });
      expect(marchResponse.ok()).toBe(true);

      await pageB.addInitScript((token) => {
        window.localStorage.setItem("dragonwake_token", token);
      }, b.token);
      await pageB.goto("/");
      await pageB.getByRole("button", { name: "Alliance", exact: true }).click();
      await expect(pageB.getByRole("heading", { name: "Shared intelligence" })).toBeVisible();
      await expect(pageB.getByText(/Allied scouts have not shared/)).toHaveCount(0, { timeout: 30_000 });
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});
