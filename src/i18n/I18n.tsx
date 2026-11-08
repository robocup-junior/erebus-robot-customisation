import {
  createContext,
  Fragment,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DEFAULT_LOCALE, findLocale, type LocaleCode, matchLocale } from './locales';
import { en, type MessageKey } from './messages/en';

const STORAGE_KEY = 'erebus-robot-customisation:language';

type Params = Record<string, string | number>;

const PLACEHOLDER = /\{(\w+)\}/g;

function template(locale: LocaleCode, key: MessageKey): string {
  return findLocale(locale)?.messages[key] ?? en[key];
}

/** The language from `?lang=`, the one chosen before, or the browser's, in that order. */
export function initialLocale(): LocaleCode {
  const fromUrl = new URLSearchParams(location.search).get('lang');
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage can be blocked; fall back to the browser's language.
  }
  return (
    matchLocale([fromUrl, stored].filter((tag): tag is string => !!tag)) ??
    matchLocale(navigator.languages ?? [navigator.language]) ??
    DEFAULT_LOCALE
  );
}

export interface I18n {
  locale: LocaleCode;
  setLocale(locale: LocaleCode): void;
  /** Text for `key` with `{placeholders}` filled in. */
  t(key: MessageKey, params?: Params): string;
  /** Like `t`, but placeholders can be elements, such as a number in bold. */
  rich(key: MessageKey, params: Record<string, ReactNode>): ReactNode;
  /** A number formatted for the language, e.g. 1,950 or 1.950. */
  number(value: number): string;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: LocaleCode) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // The choice then lasts until the page is closed.
    }
  }, []);

  const value = useMemo<I18n>(() => {
    const numberFormat = new Intl.NumberFormat(locale);
    return {
      locale,
      setLocale,
      t: (key, params = {}) =>
        template(locale, key).replace(PLACEHOLDER, (match, name: string) =>
          name in params ? String(params[name]) : match,
        ),
      rich: (key, params) =>
        template(locale, key)
          .split(PLACEHOLDER)
          // split() puts the captured placeholder names at odd indexes.
          .map((part, index) => (
            <Fragment key={index}>{index % 2 === 1 ? (params[part] ?? `{${part}}`) : part}</Fragment>
          )),
      number: (value) => numberFormat.format(value),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const i18n = useContext(I18nContext);
  if (!i18n) throw new Error('useI18n must be used inside <I18nProvider>.');
  return i18n;
}
