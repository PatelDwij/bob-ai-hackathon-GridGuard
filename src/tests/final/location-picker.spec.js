import { test, expect } from '@playwright/test';

async function setRole(page, role) {
  await page.goto('/settings.html');
  await expect(page.locator('#demoFallbackBadge')).toHaveText('Demo Fallback · Simulated Data');
  await page.locator('#operatorRole').selectOption(role);
  await page.locator('#saveBtn').click();
  await expect(page.locator('#connectionStatus')).toContainText('Settings saved');
}

async function ready(page, name) {
  await page.goto(`/${name}.html`);
  await expect(page.locator('#demoFallbackBadge')).toHaveText('Demo Fallback · Simulated Data');
  await expect(page.locator('main')).toHaveAttribute('aria-busy', 'false');
}

function record(page, collection, id) {
  return page.evaluate(({ collection, id }) => JSON.parse(sessionStorage.getItem('gridguard-demo-state-v1'))?.[collection]?.[id], { collection, id });
}

test('location picker persists selected asset coordinates', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await ready(page, 'dashboard');
  await setRole(page, 'admin');
  await ready(page, 'dashboard');

  await expect(page.locator('#mapLocationPicker')).toBeVisible();
  await page.locator('#mapPickerToggle').click();
  await expect(page.locator('#mapPickerPanel')).toBeVisible();
  const helperText = await page.locator('#mapPickerHelper').textContent();
  const target = helperText.match(/for\s+([\w-]+)\.?/)?.[1];
  expect(target).toBeTruthy();

  const before = await record(page, 'assets', target);
  expect(before).toBeTruthy();

  const map = page.locator('#dashboardMap');
  await map.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1100);
  const box = await map.boundingBox();
  await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.45);
  await expect(page.locator('#mapPickerSave')).toBeEnabled();
  expect(await page.locator('#mapPickerCoords').textContent()).toMatch(/^-?\d+\.\d{3,}, -?\d+\.\d{3,}$/);

  await page.locator('#mapPickerSave').click();
  await expect.poll(async () => {
    const after = await record(page, 'assets', target);
    return after && (after.latitude !== before.latitude || after.longitude !== before.longitude);
  }).toBe(true);

  await page.reload();
  await expect(page.locator('#demoFallbackBadge')).toHaveText('Demo Fallback · Simulated Data');
  const persisted = await record(page, 'assets', target);
  expect(persisted.latitude).not.toBe(before.latitude);
  expect(persisted.longitude).not.toBe(before.longitude);
  expect(errors).toEqual([]);
});

test('normal map interaction never mutates asset coordinates', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await ready(page, 'dashboard');
  await setRole(page, 'admin');

  for (const name of ['dashboard', 'risk-map']) {
    await ready(page, name);
    const map = page.locator(name === 'dashboard' ? '#dashboardMap' : '#map');
    await map.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1100);

    const assetIds = await page.evaluate(() => Object.keys(JSON.parse(sessionStorage.getItem('gridguard-demo-state-v1')).assets));
    const before = await page.evaluate(ids => ids.map(id => { const a = JSON.parse(sessionStorage.getItem('gridguard-demo-state-v1')).assets[id]; return [id, a.latitude, a.longitude]; }), assetIds);

    const box = await map.boundingBox();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.72, box.y + box.height * 0.6, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    await map.locator('.leaflet-control-zoom-in').click({ timeout: 6000 });
    await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.7);
    await page.waitForTimeout(500);

    const after = await page.evaluate(ids => ids.map(id => { const a = JSON.parse(sessionStorage.getItem('gridguard-demo-state-v1')).assets[id]; return [id, a.latitude, a.longitude]; }), assetIds);
    expect(after).toEqual(before);
  }
  expect(errors).toEqual([]);
});

test('location controls are absent and writes denied for reliability', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await ready(page, 'dashboard');
  await setRole(page, 'reliability');

  for (const name of ['dashboard', 'risk-map']) {
    await ready(page, name);
    await expect(page.locator('#mapLocationPicker, #editAssetBtn')).toHaveCount(0);
  }
  await ready(page, 'assets');
  await expect(page.locator('#addAssetBtn, #editAssetBtn, #ingestTelemetryBtn')).toHaveCount(0);
  const code = await page.evaluate(async () => {
    const api = await import('/js/firestore.js');
    try {
      await api.updateAsset('TR-100', { area: 'Tampered' });
      return 'ALLOWED';
    } catch (e) {
      return e.code;
    }
  });
  expect(code).toBe('permission-denied');
  expect(errors).toEqual([]);
});

test('admin can edit an asset and the update persists', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await ready(page, 'dashboard');
  await setRole(page, 'admin');
  await ready(page, 'assets');

  await expect(page.locator('#addAssetBtn')).toBeVisible();
  const firstId = await page.locator('#assetTableBody tr').first().getAttribute('data-id');
  await page.locator('#assetTableBody tr').first().click();
  await expect(page.locator('#assetDrawer')).toHaveClass(/open/);
  await expect(page.locator('#drawerAssetId')).toHaveText(firstId);
  await page.locator('#editAssetBtn').click();
  await page.locator('[name=area]').fill('Updated automated area');
  await page.locator('#ggModalSubmit').click();
  await expect(page.locator('#ggModal')).toHaveCount(0);
  await expect.poll(async () => (await record(page, 'assets', firstId))?.area).toBe('Updated automated area');
  await page.reload();
  await expect(page.locator('#assetTableBody')).toContainText('Updated automated area');
  expect(errors).toEqual([]);
});