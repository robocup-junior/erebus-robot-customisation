import { useCallback, useState } from 'react';

const LIMIT = 200;
/** Edits with the same merge key closer together than this are one undo step. */
const MERGE_WINDOW_MS = 800;

export interface MergeOptions {
  key: string;
  /** Merge however long ago the last edit was, for edits with a clear end like a drag. */
  anyTime?: boolean;
}

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
  mergeKey?: string;
  changedAt: number;
}

export function useHistory<T>(initial: () => T) {
  const [state, setState] = useState<HistoryState<T>>(() => ({
    past: [],
    present: initial(),
    future: [],
    changedAt: 0,
  }));

  const set = useCallback((update: (current: T) => T, options?: MergeOptions) => {
    setState((history) => {
      const present = update(history.present);
      if (present === history.present) return history;
      const now = Date.now();
      const merge =
        options?.key === history.mergeKey &&
        options !== undefined &&
        (options.anyTime || now - history.changedAt < MERGE_WINDOW_MS);
      return {
        past: merge ? history.past : [...history.past, history.present].slice(-LIMIT),
        present,
        future: [],
        mergeKey: options?.key,
        changedAt: now,
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState(({ past, present, future }) =>
      past.length === 0
        ? { past, present, future, changedAt: 0 }
        : {
            past: past.slice(0, -1),
            present: past[past.length - 1],
            future: [present, ...future],
            changedAt: 0,
          },
    );
  }, []);

  const redo = useCallback(() => {
    setState(({ past, present, future }) =>
      future.length === 0
        ? { past, present, future, changedAt: 0 }
        : {
            past: [...past, present],
            present: future[0],
            future: future.slice(1),
            changedAt: 0,
          },
    );
  }, []);

  return {
    value: state.present,
    set,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
