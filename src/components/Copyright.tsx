import { CalendarClock, GitBranch, GitCommitHorizontal, Hammer, Info } from 'lucide-react';
import { useId } from 'react';

declare const __BUILD_INFO__: {
  commit: string;
  commitDate: string;
  branch: string;
  dirty: boolean;
  builtAt: string;
};

const REPOSITORY = 'https://github.com/robocup-junior/erebus-robot-customisation';

const formatDate = (iso: string) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '';

/** The copyright notice; clicking it shows which commit the app was built from and when. */
export function Copyright() {
  const id = useId();
  const { commit, commitDate, branch, dirty, builtAt } = __BUILD_INFO__;
  const unknown = <span className="build-unknown">Unknown</span>;

  return (
    <>
      <button type="button" className="copyright" popoverTarget={id}>
        © 2020–2026 Erebus Development Team
        <Info size={13} aria-hidden />
      </button>
      <div id={id} popover="auto" className="build-info" role="dialog" aria-label="Build information">
        <h2>Build information</h2>
        <dl>
          <dt>
            <GitCommitHorizontal size={14} aria-hidden /> Commit
          </dt>
          <dd>
            {commit ? (
              <a href={`${REPOSITORY}/commit/${commit}`} target="_blank" rel="noreferrer">
                <code>{commit.slice(0, 7)}</code>
              </a>
            ) : (
              unknown
            )}
            {dirty && <span className="build-dirty">+ uncommitted changes</span>}
          </dd>
          <dt>
            <GitBranch size={14} aria-hidden /> Branch
          </dt>
          <dd>{branch ? <code>{branch}</code> : unknown}</dd>
          <dt>
            <CalendarClock size={14} aria-hidden /> Committed
          </dt>
          <dd>{commitDate ? <time dateTime={commitDate}>{formatDate(commitDate)}</time> : unknown}</dd>
          <dt>
            <Hammer size={14} aria-hidden /> Built
          </dt>
          <dd>
            <time dateTime={builtAt}>{formatDate(builtAt)}</time>
          </dd>
        </dl>
      </div>
    </>
  );
}
