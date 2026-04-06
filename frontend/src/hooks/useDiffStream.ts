import { useCallback, useMemo } from 'react';
import type { Diff, PatchType } from 'shared/types';
import { useJsonPatchWsStream } from './useJsonPatchWsStream';

interface DiffEntries {
  [filePath: string]: PatchType;
}

type DiffStreamEvent = {
  entries: DiffEntries;
};

interface UseDiffStreamResult {
  diffs: Diff[];
  error: string | null;
}

export const useDiffStream = (
  attemptId: string | null,
  enabled: boolean
): UseDiffStreamResult => {
  const endpoint = (() => {
    if (!attemptId) return undefined;
    return `/api/task-attempts/${attemptId}/diff/ws`;
  })();

  const initialData = useCallback(
    (): DiffStreamEvent => ({
      entries: {},
    }),
    []
  );

  const { data, error } = useJsonPatchWsStream<DiffStreamEvent>(
    endpoint,
    enabled && !!attemptId,
    initialData
    // No need for injectInitialEntry or deduplicatePatches for diffs
  );

  const diffs = useMemo(() => {
    return Object.values(data?.entries ?? {})
      .filter((entry) => entry?.type === 'DIFF')
      .map((entry) => entry.content);
  }, [data?.entries]);

  return { diffs, error };
};
