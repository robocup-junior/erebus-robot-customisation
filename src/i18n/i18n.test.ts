import { describe, expect, it } from 'vitest';
import { LOCALES, matchLocale } from './locales';
import { en, type MessageKey } from './messages/en';

/** Text that reads the same in every language, so a translation may leave it out. */
const UNIVERSAL: MessageKey[] = ['gps', 'lidar', 'view3d', 'commit', 'branch', 'labels', 'noticeProblem'];

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

describe.each(LOCALES.map((locale) => [locale.code, locale] as const))('%s', (_, locale) => {
  it('translates every text', () => {
    const missing = (Object.keys(en) as MessageKey[]).filter(
      (key) => !(key in locale.messages) && !UNIVERSAL.includes(key),
    );
    expect(missing).toEqual([]);
  });

  it('keeps the placeholders of every text', () => {
    for (const [key, text] of Object.entries(locale.messages)) {
      expect(placeholders(text), key).toEqual(placeholders(en[key as MessageKey]));
    }
  });
});

describe('matchLocale', () => {
  it.each([
    [['ja-JP'], 'ja'],
    [['de-AT', 'en'], 'de'],
    [['pt-PT'], 'pt-BR'],
    [['pt-BR'], 'pt-BR'],
    [['zh-CN'], 'zh-CN'],
    [['zh-SG'], 'zh-CN'],
    [['zh'], 'zh-CN'],
    [['zh-TW'], 'zh-Hant'],
    [['zh-HK'], 'zh-Hant'],
    [['zh-Hant-TW'], 'zh-Hant'],
    [['in-ID'], 'id'],
    [['nl-NL', 'ko-KR'], 'ko'],
    [['TH'], 'th'],
  ])('%j → %s', (tags, expected) => {
    expect(matchLocale(tags)).toBe(expected);
  });

  it('has no match for languages it does not support', () => {
    expect(matchLocale(['nl-NL', 'ru'])).toBeUndefined();
  });
});
