// A fresh local guest, normal UI inputs, no admin grants or storage mutation.
import { execFileSync } from 'node:child_process';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';

const output = 'delivery/evidence/20261030-1200-reviewer-readme-showcase';
await mkdir(`${output}/screenshots`, { recursive: true });
await mkdir(`${output}/raw`, { recursive: true });
await rm(`${output}/capture.json`, { force: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const context = await browser.newContext({ viewport: { width: 1280, height: 800 },
  recordVideo: { dir: `${output}/raw`, size: { width: 1280, height: 800 } } });
const page = await context.newPage();
page.setDefaultTimeout(15000);
const playerName = `Showcase Steward ${Date.now().toString(36)}`;
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const shot = async name => {
  await page.waitForTimeout(1200);
  if (name === '01-castle') {
    await page.getByTestId('castle-viewport-stage').screenshot({ path: `${output}/screenshots/${name}.png` });
    return;
  }
  if (name === '04-realm') await page.getByRole('heading', { name: 'The Realm', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${output}/screenshots/${name}.png` });
};
try {
  await page.goto(process.env.SHOWCASE_URL || 'http://127.0.0.1:5173');
  await page.getByLabel('Display name').fill(playerName);
  await page.getByRole('button', { name: 'Enter realm' }).click();
  await expect(page.getByRole('button', { name: 'Castle', exact: true })).toBeVisible();
  await shot('01-castle');
  await page.getByRole('button', { name: 'Empty plot 2' }).click();
  await page.locator('.city-pick', { hasText: 'Homes' }).click();
  await expect(page.getByText('Construction complete: Homes').first()).toBeVisible({ timeout: 30000 });
  await shot('02-homes-built');
  await page.getByRole('button', { name: 'Lands', exact: true }).click();
  await page.getByRole('button', { name: 'Unclaimed plot 0' }).click();
  await page.getByRole('button', { name: /Stake as Farmland/ }).click();
  await expect(page.getByText('New plot staked').first()).toBeVisible();
  await shot('03-farmland');
  await page.getByRole('button', { name: 'Realm', exact: true }).click();
  await shot('04-realm');
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
  const health = await (await page.request.get('http://localhost:3001/health')).json();
  await writeFile(`${output}/capture.json`, JSON.stringify({
    revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    capturedAt: new Date().toISOString(), browser: browser.version(),
    viewport: { width: 1280, height: 800 }, pageErrors: errors, health, playerName,
    fixture: 'Fresh guest; DEV_FAST_TIME=1, DEV_SKIP_TUTORIAL=0; in-memory local server; default artwork without opt-in flags; no admin grants',
    verified: ['guest entered through UI', 'Homes construction completed', 'farmland claimed', 'Realm opened'],
  }, null, 2) + '\n');
} finally {
  const video = page.video();
  await context.close();
  if (video) await rename(await video.path(), `${output}/raw/session.webm`);
  await browser.close();
}
