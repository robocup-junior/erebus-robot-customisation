import { BR, CN, DE, ES, FR, GB, ID, JP, KR, TH, TR, TW } from 'country-flag-icons/react/3x2';
import { Check, ChevronDown } from 'lucide-react';
import { type KeyboardEvent, useEffect, useId, useRef } from 'react';
import { useI18n } from '../i18n/I18n';
import { findLocale, LOCALES } from '../i18n/locales';

const FLAGS = { BR, CN, DE, ES, FR, GB, ID, JP, KR, TH, TR, TW };

function Flag({ country }: { country: string }) {
  const Component = FLAGS[country as keyof typeof FLAGS];
  return Component ? <Component className="flag" aria-hidden /> : null;
}

/** Language picker: each language with its flag, named in that language. */
export function LanguageMenu() {
  const { t, locale, setLocale } = useI18n();
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const current = findLocale(locale) ?? LOCALES[0];

  // Opens next to the button, above it when there's no room below (as in the footer),
  // and moves focus to the current language.
  useEffect(() => {
    const element = menu.current!;
    const onToggle = (event: Event) => {
      if ((event as ToggleEvent).newState !== 'open') return;
      const anchor = button.current!.getBoundingClientRect();
      const below = window.innerHeight - anchor.bottom;
      const above = below < element.offsetHeight + 12 && anchor.top > below;
      element.style.top = above ? 'auto' : `${anchor.bottom + 6}px`;
      element.style.bottom = above ? `${window.innerHeight - anchor.top + 6}px` : 'auto';
      element.style.right = `${Math.max(8, window.innerWidth - anchor.right)}px`;
      element.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
    };
    element.addEventListener('toggle', onToggle);
    return () => element.removeEventListener('toggle', onToggle);
  }, []);

  const onKeyDown = (event: KeyboardEvent) => {
    const items = [...menu.current!.querySelectorAll<HTMLElement>('[role="menuitemradio"]')];
    const index = items.indexOf(document.activeElement as HTMLElement);
    const next = {
      ArrowDown: (index + 1) % items.length,
      ArrowUp: (index - 1 + items.length) % items.length,
      Home: 0,
      End: items.length - 1,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    items[next].focus();
  };

  return (
    <>
      <button
        ref={button}
        type="button"
        className="button language-button"
        popoverTarget={id}
        aria-haspopup="menu"
        aria-label={`${t('language')}: ${current.name}`}
        title={t('language')}
      >
        <Flag country={current.flag} />
        <span className="language-name">{current.name}</span>
        <ChevronDown size={14} aria-hidden />
      </button>
      <div
        ref={menu}
        id={id}
        popover="auto"
        className="language-menu"
        role="menu"
        aria-label={t('language')}
        onKeyDown={onKeyDown}
      >
        {LOCALES.map((option) => (
          <button
            key={option.code}
            type="button"
            role="menuitemradio"
            aria-checked={option.code === locale}
            lang={option.code}
            onClick={() => {
              setLocale(option.code);
              menu.current?.hidePopover();
              button.current?.focus();
            }}
          >
            <Flag country={option.flag} />
            <span>{option.name}</span>
            {option.code === locale && <Check size={15} aria-hidden />}
          </button>
        ))}
      </div>
    </>
  );
}
