import { expect } from '@playwright/test';
import {
  budget,
  drag,
  nameField,
  openApp,
  position,
  rotation,
  sensorSwitch,
  setNumber,
  test,
  topView,
} from './support';

test.beforeEach(async ({ page }) => openApp(page));

const undo = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: 'Undo', exact: true });
const redo = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: 'Redo' });

test('undo and redo bring components back', async ({ page }) => {
  await expect(undo(page)).toBeDisabled();
  await sensorSwitch(page, 'Lidar').click();
  await expect(budget(page)).toHaveText('1,300');

  await undo(page).click();
  await expect(budget(page)).toHaveText('800');
  await expect(page.locator('.scene-label', { hasText: 'lidar' })).toHaveCount(0);
  await expect(page.locator('.inspector')).toHaveCount(0);

  await redo(page).click();
  await expect(budget(page)).toHaveText('1,300');
  await expect(page.locator('.scene-label', { hasText: 'lidar' })).toBeVisible();
  await expect(nameField(page)).toHaveValue('lidar');
});

test('a new edit clears redo', async ({ page }) => {
  await sensorSwitch(page, 'Lidar').click();
  await undo(page).click();
  await sensorSwitch(page, 'Gyro').click();
  await expect(redo(page)).toBeDisabled();
});

test('keyboard shortcuts work outside text fields', async ({ page }) => {
  await sensorSwitch(page, 'Lidar').click();
  await page.keyboard.press('ControlOrMeta+z');
  await expect(budget(page)).toHaveText('800');
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await expect(budget(page)).toHaveText('1,300');
});

test('one gizmo drag is one undo step and moves the model back', async ({ page }) => {
  await sensorSwitch(page, 'GPS').click();
  const at = await topView(page);
  await drag(page, at(0.08, 0), at(0.2, 0));
  await expect(position(page, 'X')).not.toHaveValue('0');

  await undo(page).click();
  await expect(position(page, 'X')).toHaveValue('0');
  await expect(sensorSwitch(page, 'GPS')).toBeChecked();
});

test('typing a name is one undo step', async ({ page }) => {
  // Hold the clock still, so that a busy machine can't spread the keys over the merge window.
  await page.clock.pauseAt(new Date());
  await sensorSwitch(page, 'GPS').click();
  await nameField(page).fill('');
  await nameField(page).pressSequentially('rover');
  await undo(page).click();
  await expect(nameField(page)).toHaveValue('gps');
});

test('separate fields are separate undo steps', async ({ page }) => {
  await sensorSwitch(page, 'GPS').click();
  await setNumber(position(page, 'X'), 10);
  await setNumber(position(page, 'Y'), 20);
  await undo(page).click();
  await expect(position(page, 'Y')).toHaveValue('0');
  await expect(position(page, 'X')).toHaveValue('10');
});

test.describe('pointing a sensor', () => {
  const point = (page: import('@playwright/test').Page, name: string) =>
    page.getByRole('group', { name: 'Point the sensor' }).getByRole('button', { name });

  test('a new sensor points to the front', async ({ page }) => {
    await sensorSwitch(page, 'GPS').click();
    await expect(point(page, 'Front')).toHaveAttribute('aria-pressed', 'true');
  });

  test('a preset sets the rotation', async ({ page }) => {
    await sensorSwitch(page, 'GPS').click();
    await point(page, 'Back').click();
    await expect(point(page, 'Back')).toHaveAttribute('aria-pressed', 'true');
    await expect(point(page, 'Front')).toHaveAttribute('aria-pressed', 'false');

    await setNumber(rotation(page, 'X'), 12);
    await expect(point(page, 'Back')).toHaveAttribute('aria-pressed', 'false');
  });

  test('wheels have no presets', async ({ page }) => {
    await page.getByRole('button', { name: /^Wheel 1/ }).click();
    await expect(page.getByRole('group', { name: 'Point the sensor' })).toHaveCount(0);
  });
});

test('the hint follows the selection and the gizmo mode', async ({ page }) => {
  const hint = page.locator('.viewport-hint');
  await expect(hint).toContainText('Click to edit');
  await sensorSwitch(page, 'GPS').click();
  await expect(hint).toHaveText('Drag an arrow to move gps');
  await page.keyboard.press('r');
  await expect(hint).toHaveText('Drag a ring to rotate gps');
});
