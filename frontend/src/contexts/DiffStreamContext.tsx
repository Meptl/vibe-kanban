import React, { createContext, useContext, useMemo } from 'react';
import type { DiffMetadata } from 'shared/types';
import { useDiffStream } from '@/hooks/useDiffStream';

type DiffStreamContextValue = {
  attemptId: string | null;
  diffs: DiffMetadata[];
  isComplete: boolean;
  error: string | null;
};

const DiffStreamContext = createContext<DiffStreamContextValue | null>(null);

export const DiffStreamProvider: React.FC<{
  attemptId: string | undefined;
  children: React.ReactNode;
}> = ({ attemptId, children }) => {
  const stream = useDiffStream(attemptId ?? null, !!attemptId);

  const value = useMemo<DiffStreamContextValue>(
    () => ({
      attemptId: attemptId ?? null,
      diffs: stream.diffs,
      isComplete: stream.isComplete,
      error: stream.error,
    }),
    [attemptId, stream.diffs, stream.isComplete, stream.error]
  );

  return (
    <DiffStreamContext.Provider value={value}>
      {children}
    </DiffStreamContext.Provider>
  );
};

export const useDiffStreamContext = () => useContext(DiffStreamContext);
