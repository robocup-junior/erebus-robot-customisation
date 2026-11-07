import { readFile } from 'node:fs/promises';
import { expect } from '@playwright/test';
import {
  budget,
  exportRobot,
  fixture,
  importRobot,
  nameField,
  openApp,
  openRow,
  sensorSwitch,
  test,
} from './support';

test.beforeEach(async ({ page }) => openApp(page));

const toast = (page: import('@playwright/test').Page) => page.locator('.toast');

test('the file name is used for the download', async ({ page }) => {
  await page.getByLabel('File name').fill('competition');
  expect((await exportRobot(page)).fileName).toBe('competition.json');
});

test('export is blocked while over budget and says why', async ({ page }) => {
  for (const sensor of ['Camera 1', 'Camera 2', 'Camera 3', 'Lidar', 'GPS']) {
    await sensorSwitch(page, sensor).click();
  }
  await expect(budget(page)).toHaveText('3,050');
  await expect(page.locator('.budget-left')).toHaveText('50 over budget');

  const exportButton = page.getByRole('button', { name: 'Export' });
  await expect(exportButton).toHaveAttribute('aria-disabled', 'true');
  const download = page.waitForEvent('download', { timeout: 500 }).catch(() => null);
  // aria-disabled keeps the button clickable, so that it can explain itself.
  await exportButton.click({ force: true });
  expect(await download).toBeNull();
  await expect(toast(page)).toContainText('50 over budget');

  await sensorSwitch(page, 'GPS').click();
  await expect(exportButton).toHaveAttribute('aria-disabled', 'false');
  await expect(page.locator('.budget-left')).toHaveText('200 left');
});

test('an empty name blocks the export and points at the component', async ({ page }) => {
  await openRow(page, 'Wheel 2');
  await nameField(page).fill('');
  await page.getByRole('button', { name: /^Wheel 2/ }).click();
  await page.getByRole('button', { name: 'Export' }).click();
  await expect(toast(page)).toContainText('Wheel 2: A name is required.');
  await expect(nameField(page)).toHaveAttribute('aria-invalid', 'true');
});

test('a duplicate name blocks the export', async ({ page }) => {
  await openRow(page, 'Wheel 2');
  await nameField(page).fill('wheel1');
  await expect(page.locator('.field-error')).toContainText('already used');
  const download = page.waitForEvent('download', { timeout: 500 }).catch(() => null);
  await page.getByRole('button', { name: 'Export' }).click();
  expect(await download).toBeNull();
});

test.describe('import', () => {
  test('replaces the robot and closes the open component', async ({ page }) => {
    await sensorSwitch(page, 'Lidar').click();
    await importRobot(page, fixture('legacy-default.json'));
    await expect(budget(page)).toHaveText('800');
    await expect(sensorSwitch(page, 'Lidar')).not.toBeChecked();
    await expect(page.locator('.inspector')).toHaveCount(0);
    await expect(toast(page)).toContainText('Imported legacy-default.json');
  });

  test('can import the same file twice', async ({ page }) => {
    await importRobot(page, fixture('legacy-configured.json'));
    await expect(budget(page)).toHaveText('2,250');
    await sensorSwitch(page, 'GPS').click();
    await importRobot(page, fixture('legacy-configured.json'));
    await expect(budget(page)).toHaveText('2,250');
  });

  test('can be undone', async ({ page }) => {
    await importRobot(page, fixture('legacy-configured.json'));
    await expect(budget(page)).toHaveText('2,250');
    await toast(page).getByRole('button', { name: 'Undo' }).click();
    await expect(budget(page)).toHaveText('800');
  });

  test('accepts a dropped file', async ({ page }) => {
    const text = await readFile(fixture('legacy-configured.json'), 'utf8');
    const transfer = await page.evaluateHandle((content) => {
      const data = new DataTransfer();
      data.items.add(new File([content], 'dropped.json', { type: 'application/json' }));
      return data;
    }, text);
    await page.dispatchEvent('.app', 'dragover', { dataTransfer: transfer });
    await expect(page.locator('.drop-overlay')).toBeVisible();
    await page.dispatchEvent('.app', 'drop', { dataTransfer: transfer });
    await expect(budget(page)).toHaveText('2,250');
    await expect(page.locator('.drop-overlay')).toHaveCount(0);
    await expect(page.getByLabel('File name')).toHaveValue('dropped');
  });

  test('keeps the current robot when a file is broken', async ({ page }) => {
    await importRobot(page, { name: 'broken.json', text: '{' });
    await expect(toast(page)).toContainText('broken.json: This file is not valid JSON.');
    await expect(toast(page)).toHaveAttribute('data-error', 'true');
    await expect(budget(page)).toHaveText('800');
  });

  test('reports the entries it ignores', async ({ page }) => {
    const gps = { x: 0, y: 0, z: 0, rx: 1, ry: 0, rz: 0, a: 0, customName: 'gps' };
    await importRobot(page, { name: 'extra.json', text: JSON.stringify({ gps, rocket: {} }) });
    await expect(toast(page)).toContainText('Ignored: rocket.');
  });

  test('shows names from a file as plain text', async ({ page }) => {
    const customName = '<img src=x onerror="document.title=1">';
    const gps = { x: 0, y: 0, z: 0, rx: 1, ry: 0, rz: 0, a: 0, customName };
    await importRobot(page, { name: 'names.json', text: JSON.stringify({ gps }) });
    await expect(page.locator('.scene-label')).toHaveText(customName);
    await expect(page.locator('.scene-label img')).toHaveCount(0);
  });
});

test.describe('draft', () => {
  test('survives a reload', async ({ page }) => {
    await sensorSwitch(page, 'Lidar').click();
    await page.getByLabel('File name').fill('work-in-progress');
    await page.reload();
    await expect(budget(page)).toHaveText('1,300');
    await expect(page.getByLabel('File name')).toHaveValue('work-in-progress');
  });

  test('is ignored when it is corrupt', async ({ page }) => {
    await page.evaluate(() =>
      localStorage.setItem('erebus-robot-customisation:draft', '{"robot":"nope"}'),
    );
    await page.reload();
    await expect(budget(page)).toHaveText('800');
  });

  test('reset restores the default robot and can be undone', async ({ page }) => {
    await sensorSwitch(page, 'Lidar').click();
    await page.getByRole('button', { name: 'Reset to the default robot' }).click();
    await expect(budget(page)).toHaveText('800');

    await toast(page).getByRole('button', { name: 'Undo' }).click();
    await expect(budget(page)).toHaveText('1,300');
  });
});
