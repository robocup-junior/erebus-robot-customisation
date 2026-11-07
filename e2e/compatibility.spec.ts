import { expect } from '@playwright/test';
import {
  budget,
  exportRobot,
  fixture,
  importRobot,
  nameField,
  openApp,
  openRow,
  position,
  readFixtureText,
  sensorSwitch,
  setNumber,
  test,
} from './support';

/**
 * The legacy-*.json fixtures were exported by the previous Angular version of this app
 * by performing the same steps. Erebus reads these files, so the export must match them
 * byte for byte.
 */
test.describe('compatibility with the previous version', () => {
  test.beforeEach(async ({ page }) => openApp(page));

  test('exports the same default robot', async ({ page }) => {
    await expect(budget(page)).toHaveText('800');
    const { text, fileName } = await exportRobot(page);
    expect(fileName).toBe('MyAwesomeRobot.json');
    expect(text).toBe(await readFixtureText('legacy-default.json'));
  });

  test('produces the same costs and file for a configured robot', async ({ page }) => {
    const steps = [
      ['Gyro', '900'],
      ['Inertial unit', '1,000'],
      ['GPS', '1,250'],
      ['Colour sensor', '1,350'],
      ['Accelerometer', '1,450'],
    ];
    for (const [sensor, cost] of steps) {
      await sensorSwitch(page, sensor).click();
      await expect(budget(page)).toHaveText(cost);
    }

    await openRow(page, 'GPS');
    await setNumber(position(page, 'X'), 120);
    await setNumber(position(page, 'Y'), 200);
    await setNumber(position(page, 'Z'), -150);
    await nameField(page).fill('my_gps');

    await sensorSwitch(page, 'Camera 1').click();
    await expect(budget(page)).toHaveText('1,950');
    await page.getByLabel('Width').selectOption('128');
    await expect(budget(page)).toHaveText('2,150');
    await page.getByLabel('Height').selectOption('64');
    await expect(budget(page)).toHaveText('2,250');

    const { text } = await exportRobot(page);
    expect(text).toBe(await readFixtureText('legacy-configured.json'));
  });

  test('imports a file from the previous version without changing it', async ({ page }) => {
    await importRobot(page, fixture('legacy-configured.json'));
    await expect(budget(page)).toHaveText('2,250');
    await expect(sensorSwitch(page, 'GPS')).toBeChecked();
    await expect(sensorSwitch(page, 'Lidar')).not.toBeChecked();

    await openRow(page, 'Camera 1');
    await expect(page.getByLabel('Width')).toHaveValue('128');
    await expect(page.getByLabel('Height')).toHaveValue('64');

    const { text, fileName } = await exportRobot(page);
    expect(fileName).toBe('legacy-configured.json');
    expect(text).toBe(await readFixtureText('legacy-configured.json'));
  });
});
