import { expect } from '@playwright/test';
import {
  canvasPicture,
  drag,
  exportRobot,
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

const modeButton = (page: import('@playwright/test').Page, name: string) =>
  page.getByRole('group', { name: 'Gizmo mode' }).getByRole('button', { name });

test.describe('selecting in the scene', () => {
  test('clicking a component opens it, clicking empty space closes it', async ({ page }) => {
    const at = await topView(page);
    await page.mouse.click(at(0.26, 0).x, at(0.26, 0).y);
    await expect(nameField(page)).toHaveValue('wheel1');
    await expect(page.locator('.scene-label.is-selected')).toHaveText('wheel1');

    await page.mouse.click(at(0.7, 0.7).x, at(0.7, 0.7).y);
    await expect(page.locator('.inspector')).toHaveCount(0);
  });

  test('orbiting does not change the selection', async ({ page }) => {
    await page.getByRole('button', { name: /^Wheel 1/ }).click();
    const at = await topView(page);
    await drag(page, at(0.7, 0.7), at(0.4, 0.6));
    await expect(nameField(page)).toHaveValue('wheel1');
  });

  test('Escape closes the selection', async ({ page }) => {
    await page.getByRole('button', { name: /^Wheel 1/ }).click();
    await page.getByRole('button', { name: /^Wheel 1/ }).focus();
    await page.keyboard.press('Escape');
    await expect(page.locator('.inspector')).toHaveCount(0);
  });
});

test.describe('gizmo', () => {
  test.beforeEach(async ({ page }) => {
    await sensorSwitch(page, 'GPS').click();
  });

  test('moving along X only changes X', async ({ page }) => {
    const at = await topView(page);
    await drag(page, at(0.08, 0), at(0.2, 0));
    await expect(position(page, 'X')).not.toHaveValue('0');
    await expect(position(page, 'Y')).toHaveValue('0');
    await expect(position(page, 'Z')).toHaveValue('0');

    const moved = Number(await position(page, 'X').inputValue());
    expect(moved).toBeGreaterThan(50);
    expect((await exportRobot(page)).robot.gps.x).toBe(moved);
  });

  test('stops at the edge of the allowed area', async ({ page }) => {
    await setNumber(position(page, 'X'), 350);
    const at = await topView(page);
    // Near the edge, the gizmo flips its arrow towards the camera.
    await drag(page, at(0.27, 0), at(0.75, 0));
    await expect(position(page, 'X')).toHaveValue('370');
  });

  test('rotating changes the rotation but not the position', async ({ page }) => {
    const before = await rotation(page, 'Y').inputValue();
    await page.keyboard.press('r');
    const at = await topView(page);
    const radius = 0.1;
    await drag(page, at(radius, 0), at(radius * 0.7, radius * 0.7));
    await expect(rotation(page, 'Y')).not.toHaveValue(before);
    await expect(position(page, 'X')).toHaveValue('0');
    await expect(position(page, 'Z')).toHaveValue('0');
  });
});

test.describe('keyboard shortcuts', () => {
  test('W and R switch the gizmo mode', async ({ page }) => {
    await page.keyboard.press('r');
    await expect(modeButton(page, 'Rotate')).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('w');
    await expect(modeButton(page, 'Move')).toHaveAttribute('aria-pressed', 'true');
  });

  test('typing a name does not trigger them', async ({ page }) => {
    await sensorSwitch(page, 'GPS').click();
    await nameField(page).fill('');
    await nameField(page).pressSequentially('rover');
    await expect(nameField(page)).toHaveValue('rover');
    await expect(modeButton(page, 'Move')).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('view options', () => {
  test('the camera view shows the frustum of a camera', async ({ page }) => {
    await sensorSwitch(page, 'Camera 1').click();
    await page.keyboard.press('Escape');
    await page.mouse.move(0, 0);
    await page.waitForTimeout(100);
    const hidden = await canvasPicture(page);
    await page.getByRole('button', { name: 'Camera view' }).click();
    await page.waitForTimeout(100);
    expect((await canvasPicture(page)).equals(hidden)).toBe(false);
  });

  test('the top view has the front of the robot at the top', async ({ page }) => {
    const at = await topView(page);
    await page.mouse.click(at(0.213, -0.32).x, at(0.213, -0.32).y);
    await expect(nameField(page)).toHaveValue('distance sensor4');
  });

  test('labels can be hidden', async ({ page }) => {
    await page.getByRole('button', { name: 'Labels' }).click();
    await expect(page.locator('.scene-labels')).toBeHidden();
  });

  test('each preset moves the camera', async ({ page }) => {
    const iso = await canvasPicture(page);
    const views = page.getByRole('group', { name: 'Camera view' });
    for (const view of ['Top', 'Front', 'Side']) {
      await views.getByRole('button', { name: view }).click();
      await page.waitForTimeout(100);
      expect((await canvasPicture(page)).equals(iso)).toBe(false);
    }
  });
});

test.describe('layout', () => {
  for (const width of [1100, 820, 390]) {
    test(`fits a ${width}px wide screen`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBe(0);
      await expect(page.locator('.viewport-stage canvas')).toBeVisible();
      await expect(page.getByRole('switch', { name: 'GPS' })).toBeVisible();
    });
  }
});

test('every icon button has a name for tooltips and screen readers', async ({ page }) => {
  await sensorSwitch(page, 'Camera 1').click();
  const unnamed = await page
    .getByRole('button')
    .evaluateAll((buttons) =>
      buttons
        .filter((button) => !button.textContent?.trim() && !button.getAttribute('aria-label'))
        .map((button) => button.outerHTML),
    );
  expect(unnamed).toEqual([]);
});

test.describe('branding', () => {
  test('the header shows the logo', async ({ page }) => {
    const logo = page.locator('.brand img');
    await expect(logo).toBeVisible();
    expect(await logo.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  });

  test('every icon in the document head exists', async ({ page, request }) => {
    const links = await page
      .locator('link[rel=icon], link[rel=apple-touch-icon], link[rel=manifest]')
      .evaluateAll((elements) => elements.map((element) => (element as HTMLLinkElement).href));
    expect(links).toHaveLength(4);
    for (const link of links) expect((await request.get(link)).ok()).toBe(true);
  });

  test('the footer shows the copyright', async ({ page }) => {
    await expect(page.getByText('© 2020–2026 RoboCupJunior Rescue Simulation')).toBeVisible();
  });
});
