import { expect } from '@playwright/test';
import {
  budget,
  exportRobot,
  nameField,
  openApp,
  openRow,
  position,
  rotation,
  sensorSwitch,
  setNumber,
  test,
} from './support';

test.beforeEach(async ({ page }) => openApp(page));

test.describe('sensors', () => {
  test('turning a sensor on and off changes the cost and the 3D scene', async ({ page }) => {
    await sensorSwitch(page, 'Lidar').click();
    await expect(budget(page)).toHaveText('1,300');
    await expect(page.locator('.scene-label', { hasText: 'lidar' })).toBeVisible();
    await expect(nameField(page)).toHaveValue('lidar');

    await sensorSwitch(page, 'Lidar').click();
    await expect(budget(page)).toHaveText('800');
    await expect(page.locator('.scene-label', { hasText: 'lidar' })).toHaveCount(0);
    expect((await exportRobot(page)).robot.lidar).toBeUndefined();
  });

  test('clicking a turned-off sensor name turns it on', async ({ page }) => {
    await page.getByRole('button', { name: /^Gyro/ }).click();
    await expect(sensorSwitch(page, 'Gyro')).toBeChecked();
  });

  test('camera resolutions are charged for each dimension', async ({ page }) => {
    await sensorSwitch(page, 'Camera 2').click();
    await page.getByLabel('Width').selectOption('256');
    await page.getByLabel('Height').selectOption('128');
    await expect(budget(page)).toHaveText('1,800');
    expect((await exportRobot(page)).robot.camera2.custom).toEqual([256, 128]);
  });

  test('all three cameras can be used at once', async ({ page }) => {
    for (const camera of ['Camera 1', 'Camera 2', 'Camera 3']) {
      await sensorSwitch(page, camera).click();
    }
    await expect(budget(page)).toHaveText('2,300');
    const { robot } = await exportRobot(page);
    expect(Object.keys(robot)).toEqual(expect.arrayContaining(['camera1', 'camera2', 'camera3']));
  });
});

test.describe('distance sensors', () => {
  const stepper = (page: import('@playwright/test').Page) => page.locator('.stepper output');
  const add = (page: import('@playwright/test').Page) =>
    page.getByRole('button', { name: 'Add a distance sensor' });
  const remove = (page: import('@playwright/test').Page) =>
    page.getByRole('button', { name: 'Remove a distance sensor' });

  test('can be added up to eight', async ({ page }) => {
    for (let i = 0; i < 4; i++) await add(page).click();
    await expect(stepper(page)).toHaveText('8');
    await expect(add(page)).toBeDisabled();
    await expect(budget(page)).toHaveText('1,000');
    const { robot } = await exportRobot(page);
    expect(robot['Distance Sensor 8']).toMatchObject({
      name: 'Distance Sensor',
      customName: 'distance sensor8',
      type: '',
    });
  });

  test('can be removed down to none, last one first', async ({ page }) => {
    await remove(page).click();
    expect((await exportRobot(page)).robot['Distance Sensor 4']).toBeUndefined();
    for (let i = 0; i < 3; i++) await remove(page).click();
    await expect(stepper(page)).toHaveText('0');
    await expect(remove(page)).toBeDisabled();
    await expect(budget(page)).toHaveText('600');
  });

  test('a removed sensor comes back at the first free number', async ({ page }) => {
    await remove(page).click();
    await add(page).click();
    await expect(nameField(page)).toHaveValue('distance sensor4');
  });
});

test.describe('wheels', () => {
  test('list their motor and rotation sensor names', async ({ page }) => {
    await openRow(page, 'Wheel 1');
    await nameField(page).fill('left');
    await expect(page.locator('.tags code')).toHaveText(['left motor', 'left sensor']);
  });

  test('stay within their narrower position limits', async ({ page }) => {
    await openRow(page, 'Wheel 1');
    await position(page, 'X').fill('300');
    await position(page, 'X').blur();
    await expect(position(page, 'X')).toHaveValue('260');
    await setNumber(position(page, 'X'), 200);
    expect((await exportRobot(page)).robot['Wheel 1'].x).toBe(200);
  });
});

test.describe('position and rotation', () => {
  test.beforeEach(async ({ page }) => {
    await sensorSwitch(page, 'GPS').click();
  });

  test('sliders and number fields stay in step', async ({ page }) => {
    await page.locator('.slider-field input[type=range]').first().fill('100');
    await expect(position(page, 'X')).toHaveValue('100');
    await setNumber(position(page, 'X'), -50);
    await expect(page.locator('.slider-field input[type=range]').first()).toHaveValue('-50');
    expect((await exportRobot(page)).robot.gps.x).toBe(-50);
  });

  test('values outside the robot are rejected', async ({ page }) => {
    await setNumber(position(page, 'Y'), 500);
    await expect(position(page, 'Y')).toHaveValue('0');
    await setNumber(position(page, 'Y'), -101);
    await expect(position(page, 'Y')).toHaveValue('0');
  });

  test('a half-typed number does not disturb the value', async ({ page }) => {
    await setNumber(position(page, 'X'), 25);
    await position(page, 'X').fill('');
    await position(page, 'X').blur();
    await expect(position(page, 'X')).toHaveValue('25');
  });

  test('rotation in degrees is exported as angle-axis', async ({ page }) => {
    await setNumber(rotation(page, 'Y'), 0);
    await setNumber(rotation(page, 'Z'), 0);
    await setNumber(rotation(page, 'X'), 30);
    const { gps } = (await exportRobot(page)).robot;
    expect(gps.rx).toBeCloseTo(1, 2);
    expect(gps.ry).toBeCloseTo(0, 2);
    expect(gps.rz).toBeCloseTo(0, 2);
    expect(gps.a).toBeCloseTo(Math.PI / 6, 2);
  });

  test('angle-axis values can be edited directly and update the degrees', async ({ page }) => {
    await page.getByText('Angle-axis values').click();
    await setNumber(page.getByRole('spinbutton', { name: 'rx' }), 0);
    await setNumber(page.getByRole('spinbutton', { name: 'ry' }), 0);
    await setNumber(page.getByRole('spinbutton', { name: 'rz' }), 1);
    await setNumber(page.getByRole('spinbutton', { name: 'angle' }), 1);
    // rz is the scene's Y axis.
    await expect(rotation(page, 'X')).toHaveValue('0');
    await expect(rotation(page, 'Y')).toHaveValue('57.3');
    await expect(rotation(page, 'Z')).toHaveValue('0');
    expect((await exportRobot(page)).robot.gps).toMatchObject({ rx: 0, ry: 0, rz: 1, a: 1 });
  });
});
