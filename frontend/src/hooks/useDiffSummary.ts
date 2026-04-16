import { useDiffStreamContext } from '@/contexts/DiffStreamContext';
import { useDiffStream } from '@/hooks/useDiffStream';
import { useMemo } from 'react';

export function useDiffSummary(attemptId: string | null) {
  const diffStreamContext = useDiffStreamContext();
  const fallbackDiffStream = useDiffStream(attemptId, !diffStreamContext);
  const { diffs, error } = diffStreamContext ?? fallbackDiffStream;

  const { fileCount, added, deleted } = useMemo(() => {
    if (!attemptId || diffs.length === 0) {
      return { fileCount: 0, added: 0, deleted: 0 };
    }

    return diffs.reduce(
      (acc, d) => {
        acc.added += d.additions ?? 0;
        acc.deleted += d.deletions ?? 0;
        return acc;
      },
      { fileCount: diffs.length, added: 0, deleted: 0 }
    );
  }, [attemptId, diffs]);

  return { fileCount, added, deleted, error };
}
