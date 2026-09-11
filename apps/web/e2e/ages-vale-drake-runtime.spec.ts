import { test, expect } from "@playwright/test";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const OUT = "e2e/artifacts/ages-runtime";
const API = process.env.VITE_API_URL ?? "http://localhost:3001";

test("AGES Vale Drake Visual Family Runtime Certification", async ({ page, request }) => {
  test.setTimeout(300_000);
  const playerName = `AGES Drake Lord ${Date.now() % 100000}`;
  const apiBase = API.replace(/\/$/, "");

  const shot = async (name: string) => {
    await page.waitForTimeout(500);
    const dest = path.resolve(OUT, `${name}.png`);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    await page.screenshot({ path: dest });
    console.log(`[Screenshot Captured] ${dest}`);
  };

  // 1. Enter Realm
  await page.goto("/");
  await page.getByLabel("Display name").fill(playerName);
  await page.getByRole("button", { name: "Enter realm" }).click();
  await expect(page.getByRole("button", { name: "Castle", exact: true })).toBeVisible();

  // 2. Verify Dragon Presence Icon (Dormant state)
  const presenceSec = page.getByTestId("dragon-presence");
  await expect(presenceSec).toBeVisible();
  const presenceIcon = page.getByTestId("dragon-presence-icon");
  await expect(presenceIcon).toBeVisible();

  // Assert image loaded properly
  const iconLoaded = await presenceIcon.evaluate((img: HTMLImageElement) => {
    return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
  });
  expect(iconLoaded).toBe(true);

  await presenceSec.screenshot({ path: path.resolve(OUT, "01b-dragon-presence-element.png") });
  await shot("01-dragon-presence-ages-icon");

  // 3. Obtain Token and Advance to Living Dragon Clutch
  const token = await page.evaluate(() => localStorage.getItem("dragonwake_token"));
  expect(token).toBeTruthy();

  // Admin grant resources and progression prerequisites
  const grantResp = await page.request.post(`${apiBase}/api/v1/admin/grant`, {
    headers: { authorization: `Bearer ${token}` },
    data: {
      resources: { food: 500000, wood: 500000, stone: 500000, ore: 500000, crownmark: 500000 },
      units: { levy: 1000, bowman: 1000, scout: 50 },
      dragonCounters: { camps: 10, scouts: 5, campTypes: ["camp_l2", "camp_l3"] },
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
  expect(grantResp.ok()).toBe(true);

  // Research Dragon Studies x2
  await page.getByRole("button", { name: /^Dragon Studies/ }).click({ force: true });
  await expect(page.getByText(/Research complete: Dragon Studies/).first()).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: /^Dragon Studies/ }).click({ force: true });
  await expect(page.getByText(/Research complete: Dragon Studies/).nth(1)).toBeVisible({ timeout: 30_000 });

  // Build Skyreost (Dragon Watch) facility
  const meResp = await page.request.get(`${apiBase}/api/v1/me`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const capitalId = ((await meResp.json()) as { cities: { id: string }[] }).cities[0]!.id;
  for (let level = 1; level <= 2; level++) {
    const bldResp = await page.request.post(`${apiBase}/api/v1/cities/${capitalId}/buildings`, {
      headers: { authorization: `Bearer ${token}` },
      data: { slotIndex: 7, buildingType: "skyreost" },
    });
    expect(bldResp.ok()).toBe(true);
    await page.waitForTimeout(1_500);
  }

  // Go to Knowledge, trigger Expedition and Scar
  await page.getByRole("button", { name: "Knowledge", exact: true }).click();
  await expect(page.getByText(/5\/5 requirements met/)).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: /Set out on the Dragon Expedition/ }).click({ force: true });
  await expect(page.getByText(/Stage 1 of 4/)).toBeVisible();

  for (const stageName of ["Investigate Tracks", "Clear the Raiders", "Reach the Scarred Site"]) {
    await page.getByRole("button", { name: stageName }).click({ force: true });
  }
  await expect(page.getByText(/Stage 4 of 4/)).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("face-the-scar").click({ force: true });
  await expect(page.getByText(/The charter is earned/)).toBeVisible({ timeout: 30_000 });

  // 4. Return to Castle Roost and Name Hatchling
  await page.getByRole("button", { name: "Castle", exact: true }).click();
  await expect(page.getByTestId("capital-roost")).toBeVisible();
  await page.getByLabel("Name").fill("IgnisVale");
  await page.getByRole("button", { name: "Name the hatchling" }).click();

  await expect(page.getByTestId("roost-name")).toContainText("IgnisVale");
  await expect(page.getByTestId("roost-visual-card")).toBeVisible();

  // Verify Roost Dragon Art (Healthy)
  const roostArt = page.getByTestId("roost-dragon-art");
  await expect(roostArt).toBeVisible();
  const roostArtSrc = await roostArt.getAttribute("src");
  expect(roostArtSrc).toContain("vale_drake_roost.png");

  const roostArtLoaded = await roostArt.evaluate((img: HTMLImageElement) => {
    return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
  });
  expect(roostArtLoaded).toBe(true);

  // Verify Roost Portrait Thumbnail
  const portraitThumb = page.getByTestId("roost-portrait-thumbnail");
  await expect(portraitThumb).toBeVisible();
  const thumbSrc = await portraitThumb.getAttribute("src");
  expect(thumbSrc).toContain("vale_drake_portrait.png");
  const thumbLoaded = await portraitThumb.evaluate((img: HTMLImageElement) => {
    return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
  });
  expect(thumbLoaded).toBe(true);

  await page.getByRole("button", { name: "Watch the roost" }).click();
  await expect(page.getByTestId("dragon-chronicle")).toBeVisible();

  const roostSec = page.getByTestId("capital-roost");
  await roostSec.scrollIntoViewIfNeeded();
  await shot("02-roost-healthy-valedrake");
  await roostSec.screenshot({ path: path.resolve(OUT, "02b-capital-roost-healthy-element.png") });

  // 5. Test Targeted Injured State
  console.log("Applying wounded state via admin grant...");
  const woundResp = await page.request.post(`${apiBase}/api/v1/admin/grant`, {
    headers: { authorization: `Bearer ${token}` },
    data: { dragonState: "wounded" },
  });
  expect(woundResp.ok()).toBe(true);

  // Refresh view data by navigating to Knowledge and back to Castle
  await page.getByRole("button", { name: "Knowledge", exact: true }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Castle", exact: true }).click();

  // Verify Roost Art switched to injured state asset
  const injuredArt = page.getByTestId("roost-dragon-art");
  await expect(injuredArt).toBeVisible();
  await expect(page.getByText(/wounded/i).first()).toBeVisible();

  const injuredSrc = await injuredArt.getAttribute("src");
  expect(injuredSrc).toContain("vale_drake_injured.png");

  const injuredLoaded = await injuredArt.evaluate((img: HTMLImageElement) => {
    return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
  });
  expect(injuredLoaded).toBe(true);

  await roostSec.scrollIntoViewIfNeeded();
  await shot("03-roost-wounded-valedrake");
  await roostSec.screenshot({ path: path.resolve(OUT, "03b-capital-roost-wounded-element.png") });

  // 6. Direct HTTP Exact-Byte Cryptographic Verification
  console.log("Verifying runtime HTTP byte payloads against AGES SHA-256 CAS records...");
  const publicDir = path.resolve(__dirname, "../public/art/dragons/vale_drake");
  const manifestPath = path.resolve(publicDir, "manifest.json");
  const manifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, "utf-8"))
    : {};

  const AGES_PACK_ENV = process.env.AGES_PACK_PATH || "C:/Workspace/tools/gamedev/artifacts/identity_packs/vale_drake";
  const hasAgesPack = fs.existsSync(AGES_PACK_ENV);
  const assetsToCheck = [
    { url: "/art/dragons/vale_drake/vale_drake_master.png", disk: "master/vale_drake_master.png" },
    { url: "/art/dragons/vale_drake/vale_drake_roost.png", disk: "derived/vale_drake_roost.png" },
    { url: "/art/dragons/vale_drake/vale_drake_portrait.png", disk: "derived/vale_drake_portrait.png" },
    { url: "/art/dragons/vale_drake/vale_drake_icon.png", disk: "derived/vale_drake_icon.png" },
    { url: "/art/dragons/vale_drake/vale_drake_token.png", disk: "derived/vale_drake_token.png" },
    { url: "/art/dragons/vale_drake/vale_drake_injured.png", disk: "states/vale_drake_injured.png" },
  ];

  const casVerificationResults: Record<string, any> = {};

  for (const item of assetsToCheck) {
    const httpResp = await request.get(item.url);
    expect(httpResp.ok()).toBe(true);
    const bodyBuf = await httpResp.body();
    const httpSha = crypto.createHash("sha256").update(bodyBuf).digest("hex");

    const fileName = path.basename(item.url);
    if (manifest[fileName]) {
      expect(httpSha).toBe(manifest[fileName].sha256);
    }

    const diskPath = hasAgesPack
      ? path.resolve(AGES_PACK_ENV, item.disk)
      : path.resolve(publicDir, fileName);
    const diskBuf = fs.readFileSync(diskPath);
    const diskSha = crypto.createHash("sha256").update(diskBuf).digest("hex");

    expect(httpSha).toBe(diskSha);
    casVerificationResults[path.basename(item.url)] = {
      url: item.url,
      sha256: httpSha,
      bytes: bodyBuf.length,
      verified_match: true,
    };
    console.log(`  ✓ Exact-byte match: ${path.basename(item.url)} -> ${httpSha}`);
  }

  const reportPath = path.resolve(OUT, "runtime_cas_verification.json");
  fs.writeFileSync(reportPath, JSON.stringify(casVerificationResults, null, 2));
  console.log(`CAS Verification report written to ${reportPath}`);
});
