import { readFile } from 'node:fs/promises';
import { expect, type Locator, type Page, test as base } from '@playwright/test';

export type RobotFile = Record<string, Record<string, unknown>>;

/** Fails any test in which the page logs an error. */
export const test = base.extend<{ failOnPageErrors: void }>({
  failOnPageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await use();
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});

export const fixture = (name: string) => `e2e/fixtures/${name}`;

export const readFixture = async (name: string): Promise<RobotFile> =>
  JSON.parse(await readFile(fixture(name), 'utf8'));

/** The fixture exactly as the previous version wrote it, byte for byte. */
export const readFixtureText = (name: string) => readFile(fixture(name), 'utf8');

export async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Erebus Robot Customisation' })).toBeVisible();
  await expect(page.locator('.scene-label')).toHaveCount(6);
}

export async function exportRobot(page: Page) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export' }).click(),
  ]);
  const path = await download.path();
  const text = await readFile(path, 'utf8');
  return {
    fileName: download.suggestedFilename(),
    text,
    robot: JSON.parse(text) as RobotFile,
  };
}

export async function importRobot(page: Page, file: string | { name: string; text: string }) {
  await page.getByLabel('Robot file').setInputFiles(
    typeof file === 'string'
      ? file
      : { name: file.name, mimeType: 'application/json', buffer: Buffer.from(file.text) },
  );
}

export const budget = (page: Page) => page.locator('.budget-used');
export const sensorSwitch = (page: Page, name: string) => page.getByRole('switch', { name });
export const openRow = (page: Page, name: string) =>
  page.getByRole('button', { name: new RegExp(`^${name}`) }).click();
export const position = (page: Page, axis: string) =>
  page.getByRole('spinbutton', { name: `Position ${axis}` });
export const rotation = (page: Page, axis: string) =>
  page.getByRole('spinbutton', { name: `Rotation ${axis}` });
export const nameField = (page: Page) => page.getByLabel('Name', { exact: true });

/** Commits a number field the way a user does, by typing and leaving the field. */
export async function setNumber(field: Locator, value: number) {
  await field.fill(String(value));
  await field.blur();
}

/** Switches to the top view and returns a helper to convert metres on the floor to pixels. */
export async function topView(page: Page) {
  await page.getByRole('group', { name: 'Camera view' }).getByRole('button', { name: 'Top' }).click();
  await page.waitForTimeout(100);
  const box = (await page.locator('.viewport-stage canvas').boundingBox())!;
  const pixelsPerMetre = box.height / 2 / (1.9 * Math.tan((22.5 * Math.PI) / 180));
  // Looking down from above with the front of the robot (-Z) at the top of the screen.
  return (x: number, z: number) => ({
    x: box.x + box.width / 2 + x * pixelsPerMetre,
    y: box.y + box.height / 2 + z * pixelsPerMetre,
  });
}

export async function drag(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.move(from.x + 1, from.y);
  await page.waitForTimeout(50);
  await page.mouse.down();
  await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 4 });
  await page.mouse.move(to.x, to.y, { steps: 4 });
  await page.mouse.up();
}

export const canvasPicture = (page: Page) =>
  page.locator('.viewport-stage canvas').screenshot();
