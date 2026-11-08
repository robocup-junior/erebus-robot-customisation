import type { Messages } from './messages/en';
import { de } from './messages/de';
import { en } from './messages/en';
import { es } from './messages/es';
import { fr } from './messages/fr';
import { id } from './messages/id';
import { ja } from './messages/ja';
import { ko } from './messages/ko';
import { ptBR } from './messages/pt-BR';
import { th } from './messages/th';
import { tr } from './messages/tr';
import { zhCN } from './messages/zh-CN';
import { zhHant } from './messages/zh-Hant';

export interface Locale {
  /** BCP 47 tag, also used for `<html lang>` and number and date formatting. */
  code: string;
  /** Name of the language in that language. */
  name: string;
  /** ISO 3166 country code of the flag shown next to the name. */
  flag: string;
  messages: Messages;
}

/** In the order shown in the language menu. */
export const LOCALES = [
  { code: 'id', name: 'Bahasa Indonesia', flag: 'ID', messages: id },
  { code: 'de', name: 'Deutsch', flag: 'DE', messages: de },
  { code: 'en', name: 'English', flag: 'GB', messages: en },
  { code: 'es', name: 'Español', flag: 'ES', messages: es },
  { code: 'fr', name: 'Français', flag: 'FR', messages: fr },
  { code: 'pt-BR', name: 'Português (Brasil)', flag: 'BR', messages: ptBR },
  { code: 'tr', name: 'Türkçe', flag: 'TR', messages: tr },
  { code: 'th', name: 'ไทย', flag: 'TH', messages: th },
  { code: 'zh-CN', name: '中文（简体）', flag: 'CN', messages: zhCN },
  { code: 'zh-Hant', name: '中文（繁體）', flag: 'TW', messages: zhHant },
  { code: 'ja', name: '日本語', flag: 'JP', messages: ja },
  { code: 'ko', name: '한국어', flag: 'KR', messages: ko },
] as const satisfies readonly Locale[];

export type LocaleCode = (typeof LOCALES)[number]['code'];

export const DEFAULT_LOCALE: LocaleCode = 'en';

export const findLocale = (code: string): Locale | undefined =>
  LOCALES.find((locale) => locale.code.toLowerCase() === code.toLowerCase());

const TRADITIONAL_CHINESE = ['hant', 'tw', 'hk', 'mo'];

/** The supported language closest to the first tag that has one, e.g. from `navigator.languages`. */
export function matchLocale(tags: readonly string[]): LocaleCode | undefined {
  for (const tag of tags) {
    const exact = findLocale(tag);
    if (exact) return exact.code as LocaleCode;
    const [language, ...subtags] = tag.toLowerCase().split(/[-_]/);
    if (language === 'zh') {
      return subtags.some((subtag) => TRADITIONAL_CHINESE.includes(subtag)) ? 'zh-Hant' : 'zh-CN';
    }
    if (language === 'pt') return 'pt-BR';
    // "in" is the old code for Indonesian, still sent by some Android devices.
    if (language === 'in') return 'id';
    const match = findLocale(language);
    if (match) return match.code as LocaleCode;
  }
  return undefined;
}
