import { CalendarClock, GitBranch, GitCommitHorizontal, Hammer, Info } from 'lucide-react';
import { useId } from 'react';
import { useI18n } from '../i18n/I18n';

declare const __BUILD_INFO__: {
  commit: string;
  commitDate: string;
  branch: string;
  dirty: boolean;
  builtAt: string;
};

const REPOSITORY = 'https://github.com/robocup-junior/erebus-robot-customisation';

const formatDate = (iso: string, locale: string) =>
  new Date(iso).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });

/** The copyright notice; clicking it shows which commit the app was built from and when. */
export function Copyright() {
  const id = useId();
  const { t, locale } = useI18n();
  const { commit, commitDate, branch, dirty, builtAt } = __BUILD_INFO__;
  const unknown = <span className="build-unknown">{t('unknown')}</span>;

  return (
    <>
      <button type="button" className="copyright" popoverTarget={id}>
        © 2020–2026 Erebus Development Team
        <Info size={13} aria-hidden />
      </button>
      <div id={id} popover="auto" className="build-info" role="dialog" aria-label={t('buildInfo')}>
        <h2>{t('buildInfo')}</h2>
        <dl>
          <dt>
            <GitCommitHorizontal size={14} aria-hidden /> {t('commit')}
          </dt>
          <dd>
            {commit ? (
              <a href={`${REPOSITORY}/commit/${commit}`} target="_blank" rel="noreferrer">
                <code>{commit.slice(0, 7)}</code>
              </a>
            ) : (
              unknown
            )}
            {dirty && <span className="build-dirty">{t('uncommitted')}</span>}
          </dd>
          <dt>
            <GitBranch size={14} aria-hidden /> {t('branch')}
          </dt>
          <dd>{branch ? <code>{branch}</code> : unknown}</dd>
          <dt>
            <CalendarClock size={14} aria-hidden /> {t('committed')}
          </dt>
          <dd>{commitDate ? (
              <time dateTime={commitDate}>{formatDate(commitDate, locale)}</time>
            ) : (
              unknown
            )}</dd>
          <dt>
            <Hammer size={14} aria-hidden /> {t('built')}
          </dt>
          <dd>
            <time dateTime={builtAt}>{formatDate(builtAt, locale)}</time>
          </dd>
        </dl>
      </div>
    </>
  );
}
