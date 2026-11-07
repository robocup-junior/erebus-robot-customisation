import { expect, type Page } from '@playwright/test';
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

const addDistanceSensor = (page: Page) =>
  page.getByRole('button', { name: 'Add a distance sensor' });
const removeDistanceSensor = (page: Page) =>
  page.getByRole('button', { name: 'Remove a distance sensor' });

/**
 * The legacy-*.json fixtures were exported by the previous Angular version of this app
 * by performing the same steps (two-distance-sensors.json and
 * old-style-rotations.json are inputs made by hand). Erebus
 * reads these files, so the export must match them byte for byte.
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

  test('exports the same file after adding cameras, a lidar and changing distance sensors', async ({
    page,
  }) => {
    await sensorSwitch(page, 'Lidar').click();
    await sensorSwitch(page, 'Camera 2').click();
    await sensorSwitch(page, 'Camera 3').click();
    await openRow(page, 'Camera 2');
    await page.getByLabel('Width').selectOption('256');
    await expect(budget(page)).toHaveText('2,600');

    // Removing distance sensors and adding one back restores its default values.
    await removeDistanceSensor(page).click();
    await removeDistanceSensor(page).click();
    await addDistanceSensor(page).click();
    await expect(budget(page)).toHaveText('2,550');

    await openRow(page, 'Distance Sensor 1');
    await setNumber(position(page, 'X'), 10);
    await page.getByText('Angle-axis values').click();
    await setNumber(page.getByRole('spinbutton', { name: 'rx' }), 0);
    await setNumber(page.getByRole('spinbutton', { name: 'ry' }), 1);
    await setNumber(page.getByRole('spinbutton', { name: 'rz' }), 0);
    await setNumber(page.getByRole('spinbutton', { name: 'angle' }), 1.57);
    await nameField(page).fill('front_ds');

    await openRow(page, 'Wheel 1');
    await setNumber(position(page, 'X'), -100);
    await setNumber(position(page, 'Z'), 50);

    const { text } = await exportRobot(page);
    expect(text).toBe(await readFixtureText('legacy-extended.json'));
  });

  test('exports the same file with more than four distance sensors', async ({ page }) => {
    await addDistanceSensor(page).click();
    await addDistanceSensor(page).click();
    await expect(budget(page)).toHaveText('900');
    const { text } = await exportRobot(page);
    expect(text).toBe(await readFixtureText('legacy-six-distance.json'));
  });

  test('exports the same file after adding a distance sensor to an imported robot', async ({
    page,
  }) => {
    await importRobot(page, fixture('two-distance-sensors.json'));
    await expect(budget(page)).toHaveText('700');
    await addDistanceSensor(page).click();
    await expect(budget(page)).toHaveText('750');
    const { text } = await exportRobot(page);
    expect(text).toBe(await readFixtureText('legacy-import-add.json'));
  });

  test('keeps every value of an imported file that is not edited', async ({ page }) => {
    // Rotations as the previous version wrote them: two decimals, an axis that is not
    // normalised and a negative angle.
    await importRobot(page, fixture('old-style-rotations.json'));
    for (const row of ['Gyro', 'Lidar', 'Distance Sensor 2', 'Wheel 1', 'Camera 2']) {
      await openRow(page, row);
      await page.getByText('Angle-axis values').click();
    }
    const original = await readFixtureText('old-style-rotations.json');
    expect((await exportRobot(page)).text).toBe(original);

    await openRow(page, 'Gyro');
    await setNumber(position(page, 'X'), 31);
    const edited = original.replace('"x": 30,', '"x": 31,');
    expect(edited).not.toBe(original);
    expect((await exportRobot(page)).text).toBe(edited);
  });
});

