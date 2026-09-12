import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTIFACTS_DIR = path.resolve(__dirname, "artifacts/sprite-preview");

test.describe("Sprite Preview & Runtime Verification Suite", () => {
  test.beforeAll(() => {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  });

  test("Test A: Generic synthetic fixture at /sprite-preview.html?fixture=synthetic", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => {
      consoleErrors.push(err.message);
    });

    // 1. Navigate to preview harness with synthetic fixture
    await page.goto("/sprite-preview.html?fixture=synthetic");

    // 2. Verify harness mounts and displays PREVIEW_ONLY and synthetic subject
    await expect(page.getByTestId("sprite-preview-harness")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("preview-status-badge")).toHaveText("PREVIEW_ONLY");
    await expect(page.getByTestId("preview-subject-id")).toHaveText("synthetic_test_sprite");

    // 3. Verify CAS verification succeeded for synthetic atlas
    await expect(page.getByTestId("cas-verified-indicator")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("cas-verified-indicator")).toContainText("✓ CAS Verified");

    // 4. Verify primary canvas is rendering
    const canvas = page.getByTestId("animated-sprite-canvas").first();
    await expect(canvas).toBeVisible();

    // 5. Test State Transitions
    // Initial state is idle
    await expect(page.getByTestId("btn-state-idle")).toBeVisible();

    // Switch to Walk
    await page.getByTestId("btn-state-walk").click();
    await page.waitForTimeout(600); // allow walk frames to tick

    // Switch to Attack (one-shot)
    await page.getByTestId("btn-state-attack").click();

    // Verify bite_impact event log entry appears
    await expect(page.getByTestId("event-log")).toContainText("bite_impact", { timeout: 5000 });

    // Verify auto-transition back to idle after attack finishes (1000ms duration)
    await expect(page.getByTestId("event-log")).toContainText("Returning from attack -> idle", { timeout: 8000 });

    // 6. Test Debug Overlays
    await page.getByTestId("chk-debug-pivot").check();
    await page.getByTestId("chk-debug-root").check();
    await page.getByTestId("chk-debug-bounds").check();
    await page.waitForTimeout(200);

    // Capture screenshot of synthetic harness
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "01-synthetic-preview.png") });

    // 7. Verify zero console errors
    expect(consoleErrors).toEqual([]);
  });

  test("Test B: Real Vale Drake preview certification and kinematic evaluation", async ({ page }) => {
    const previewCurrentPath = path.resolve(__dirname, "../.preview-assets/current.json");
    test.skip(!fs.existsSync(previewCurrentPath), "Skipping real asset preview certification: .preview-assets/current.json not present in this environment.");

    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => {
      consoleErrors.push(err.message);
    });

    // 1. Navigate to default preview harness (loads current imported preview asset)
    await page.goto("/sprite-preview.html");

    // 2. Verify harness mounts and displays real Vale Drake
    await expect(page.getByTestId("sprite-preview-harness")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("preview-status-badge")).toHaveText("PREVIEW_ONLY");
    await expect(page.getByTestId("preview-subject-id")).toHaveText("dragon_vale_drake");

    // 3. Cryptographic CAS validation check
    // Real Vale Drake atlas sha256 prefix is f2f0e66a
    await expect(page.getByTestId("cas-verified-indicator")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("cas-verified-indicator")).toContainText("f2f0e66a");

    // 4. Verify Animation Dispositions
    await expect(page.getByTestId("disposition-idle")).toHaveText("ACCEPT");
    await expect(page.getByTestId("disposition-walk")).toHaveText("WARN_CONDITIONAL");
    await expect(page.getByTestId("disposition-attack")).toHaveText("ACCEPT");

    // 5. Verify Idle Playback and capture screenshot
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "02-vale-drake-idle.png"), fullPage: true });

    // 6. Verify Walk Playback and Multi-Scale Views
    await page.getByTestId("btn-state-walk").click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "03-vale-drake-walk.png") });

    // Verify all 3 scale viewports exist
    await expect(page.getByTestId("scale-view-native")).toBeVisible();
    await expect(page.getByTestId("scale-view-roost")).toBeVisible();
    await expect(page.getByTestId("scale-view-map")).toBeVisible();

    // 7. Verify Attack One-Shot and bite_impact event
    await page.getByTestId("btn-state-attack").click();

    // Verify bite_impact event is dispatched and logged
    await expect(page.getByTestId("event-log")).toContainText("bite_impact", { timeout: 3000 });
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "04-vale-drake-attack.png") });

    // Wait for attack completion and auto-recovery to idle
    await expect(page.getByTestId("event-log")).toContainText("Returning from attack -> idle", { timeout: 5000 });

    // 8. Kinematic Evaluation: Movement Simulator Along Southwest Vector
    await page.getByTestId("btn-state-walk").click();
    await page.getByTestId("btn-toggle-sim-move").click();

    // Test different speeds: 60, 90, 140 px/s
    await page.getByTestId("btn-move-speed-60").click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "05-vale-drake-movement-60px.png") });

    await page.getByTestId("btn-move-speed-90").click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "06-vale-drake-movement-90px.png"), fullPage: true });

    await page.getByTestId("btn-move-speed-140").click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "07-vale-drake-movement-140px.png") });

    // Stop movement simulator
    await page.getByTestId("btn-toggle-sim-move").click();

    // 9. Verify zero console errors
    expect(consoleErrors).toEqual([]);
  });
});
