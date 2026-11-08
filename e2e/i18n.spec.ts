import { readFile } from 'node:fs/promises';
import { expect, type Page } from '@playwright/test';
import { openApp, readFixtureText, test } from './support';

const languageButton = (page: Page) => page.locator('.language-button');

async function chooseLanguage(page: Page, name: string) {
  await languageButton(page).click();
  await page.getByRole('menuitemradio', { name }).click();
}

test.describe('choosing a language', () => {
  test.beforeEach(async ({ page }) => openApp(page));

  test('translates the page and remembers the choice', async ({ page }) => {
    await expect(languageButton(page)).toHaveAccessibleName('Language: English');
    await chooseLanguage(page, '日本語');

    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
    await expect(page.getByRole('button', { name: '読み込む' })).toBeVisible();
    await expect(page.locator('.budget-left')).toHaveText('残り 2,200');
    await expect(page.getByRole('switch', { name: 'カメラ 1' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^距離センサー 1/ })).toBeVisible();

    await page.reload();
    await expect(languageButton(page)).toHaveAccessibleName('言語: 日本語');
    await expect(page.getByRole('button', { name: '読み込む' })).toBeVisible();
  });

  test('lists every language with its flag, named in that language', async ({ page }) => {
    await languageButton(page).click();
    const items = page.getByRole('menuitemradio');
    await expect(items).toHaveText([
      'Bahasa Indonesia',
      'Deutsch',
      'English',
      'Español',
      'Français',
      'Português (Brasil)',
      'Türkçe',
      'ไทย',
      '中文（简体）',
      '中文（繁體）',
      '日本語',
      '한국어',
    ]);
    for (const item of await items.all()) await expect(item.locator('svg.flag')).toBeVisible();
    await expect(page.getByRole('menuitemradio', { name: 'English' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  test('can be used with the keyboard', async ({ page }) => {
    await languageButton(page).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menuitemradio', { name: 'English' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitemradio', { name: 'Español' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Importar' })).toBeVisible();
    await expect(page.getByRole('menu')).toBeHidden();
  });

  test('opens above the button in the footer and stays on screen', async ({ page }) => {
    await languageButton(page).click();
    const menu = (await page.getByRole('menu').boundingBox())!;
    const button = (await languageButton(page).boundingBox())!;
    expect(menu.y + menu.height).toBeLessThanOrEqual(button.y);
    expect(menu.y).toBeGreaterThanOrEqual(0);
  });

  test('does not change the exported file', async ({ page }) => {
    await chooseLanguage(page, '中文（繁體）');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: '匯出' }).click(),
    ]);
    const text = await readFile((await download.path())!, 'utf8');
    expect(text).toBe(await readFixtureText('legacy-default.json'));
  });

  test('explains file errors in the chosen language', async ({ page }) => {
    await chooseLanguage(page, 'Deutsch');
    await page.getByLabel('Roboterdatei').setInputFiles({
      name: 'broken.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{'),
    });
    await expect(page.locator('.toast')).toContainText('broken.json: Diese Datei ist kein gültiges JSON.');
  });
});

test.describe('the language of the browser', () => {
  for (const [browser, expected] of [
    ['ja-JP', '日本語'],
    ['zh-TW', '中文（繁體）'],
    ['pt-PT', 'Português (Brasil)'],
    ['nl-NL', 'English'],
  ] as const) {
    test.describe(browser, () => {
      test.use({ locale: browser });
      test(`is used at first: ${expected}`, async ({ page }) => {
        await openApp(page);
        await expect(languageButton(page)).toHaveAccessibleName(new RegExp(`: ${expected.replace(/[()]/g, '\\$&')}$`));
      });
    });
  }

  test('is overridden by ?lang=', async ({ page }) => {
    await page.goto('/?lang=ko');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
    await expect(page.getByRole('button', { name: '가져오기' })).toBeVisible();
  });
});

test.describe('every language fits the page without scrolling sideways', () => {
  // Each test loads a page and lays it out three times, which is slow on a busy machine.
  test.describe.configure({ timeout: 60_000 });

  for (const code of ['id', 'de', 'es', 'fr', 'pt-BR', 'tr', 'th', 'zh-CN', 'zh-Hant', 'ja', 'ko']) {
    test(code, async ({ page }) => {
      await page.goto(`/?lang=${code}`);
      await page.getByRole('switch').first().waitFor();
      for (const width of [1440, 900, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await expect
          .poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth))
          .toBeLessThanOrEqual(0);
        const copyright = (await page.locator('.copyright').boundingBox())!;
        expect(copyright.height, `copyright on one line at ${width}px`).toBeLessThan(30);
      }
    });
  }
});
