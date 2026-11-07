import { expect } from '@playwright/test';
import { budget, openApp, sensorSwitch, test } from './support';

test.beforeEach(async ({ page }) => openApp(page));

const left = (page: import('@playwright/test').Page) => page.locator('.budget-left');
const status = (page: import('@playwright/test').Page) => page.locator('.budget-status');
const legend = (page: import('@playwright/test').Page) => page.locator('.budget-legend li');

test('shows what is left and where the budget went', async ({ page }) => {
  await expect(left(page)).toHaveText('2,200 left');
  await expect(page.locator('.budget-total')).toHaveText('800 / 3,000 used');
  await expect(legend(page)).toHaveText(['Wheels 600', 'Distance 200', 'Sensors 0', 'Cameras 0']);

  await sensorSwitch(page, 'Camera 1').click();
  await page.getByLabel('Width').selectOption('128');
  await sensorSwitch(page, 'GPS').click();
  await expect(legend(page)).toHaveText([
    'Wheels 600',
    'Distance 200',
    'Sensors 250',
    'Cameras 700',
  ]);
});

test('previews the effect of a sensor before adding it', async ({ page }) => {
  await page.getByRole('button', { name: /^Lidar/ }).hover();
  await expect(status(page)).toHaveText('Lidar −5001,700 left');
  await expect(page.locator('.budget-segment--preview')).toBeVisible();
  await expect(budget(page)).toHaveText('800');

  await page.mouse.move(0, 0);
  await expect(page.locator('.budget-segment--preview')).toHaveCount(0);
});

test('warns about a sensor that does not fit', async ({ page }) => {
  for (const sensor of ['Camera 1', 'Camera 2', 'Camera 3', 'Lidar']) {
    await sensorSwitch(page, sensor).click();
  }
  await page.getByRole('button', { name: /^GPS/ }).hover();
  await expect(status(page)).toHaveText('GPS −25050 over');
  await expect(status(page)).toHaveAttribute('data-warn', 'true');
  await expect(page.locator('.row', { hasText: 'GPS' }).locator('.cost')).toHaveAttribute(
    'data-warn',
    'true',
  );
});

test('adding a previewed sensor ends the preview', async ({ page }) => {
  await page.getByRole('button', { name: /^Gyro/ }).click();
  await expect(page.locator('.budget-segment--preview')).toHaveCount(0);
  await expect(left(page)).toHaveText('2,100 left');
});

test('the status explains the rule, and what to do when over budget', async ({ page }) => {
  await expect(status(page)).toHaveText('Stay within 3,000 to export');
  for (const sensor of ['Camera 1', 'Camera 2', 'Camera 3', 'Lidar', 'GPS']) {
    await sensorSwitch(page, sensor).click();
  }
  await page.mouse.move(0, 0);
  await expect(left(page)).toHaveText('50 over budget');
  await expect(status(page)).toHaveText('Remove 50 to export');
});

test('the remaining amount only turns red when over budget', async ({ page }) => {
  const color = () =>
    page.locator('.budget-left strong').evaluate((element) => getComputedStyle(element).color);
  const danger = await page.evaluate(() => {
    const probe = document.createElement('i');
    probe.style.color = 'var(--danger)';
    document.body.append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  });

  expect(await color()).not.toBe(danger);
  for (const sensor of ['Camera 1', 'Camera 2', 'Camera 3', 'Lidar', 'GPS']) {
    await sensorSwitch(page, sensor).click();
  }
  await expect(left(page)).toHaveText('50 over budget');
  expect(await color()).toBe(danger);
});

test('the breakdown stays on one line', async ({ page }) => {
  for (const sensor of ['Camera 1', 'Camera 2', 'Camera 3']) {
    await sensorSwitch(page, sensor).click();
  }
  const tops = await legend(page).evaluateAll((items) =>
    items.map((item) => item.getBoundingClientRect().top),
  );
  expect(new Set(tops).size).toBe(1);
});
