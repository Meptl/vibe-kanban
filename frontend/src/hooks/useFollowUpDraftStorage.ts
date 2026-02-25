import { useCallback, useEffect, useState } from 'react';
import type { DraftFollowUpData } from 'shared/types';
import {
  clearFollowUpDraftScratch,
  readFollowUpDraftScratch,
  writeFollowUpDraftScratch,
} from '@/lib/followUpDraftScratch';

export function useFollowUpDraftStorage(attemptId?: string) {
  const [draft, setDraft] = useState<DraftFollowUpData | null>(() =>
    readFollowUpDraftScratch(attemptId)
  );

  useEffect(() => {
    setDraft(readFollowUpDraftScratch(attemptId));
  }, [attemptId]);

  const saveDraft = useCallback(
    (nextDraft: DraftFollowUpData) => {
      if (!attemptId || typeof window === 'undefined') return;

      try {
        writeFollowUpDraftScratch(attemptId, nextDraft);
        setDraft(readFollowUpDraftScratch(attemptId));
      } catch (error) {
        console.error('Failed to persist follow-up draft to localStorage', error);
      }
    },
    [attemptId]
  );

  const clearDraft = useCallback(() => {
    if (!attemptId || typeof window === 'undefined') {
      setDraft(null);
      return;
    }

    try {
      clearFollowUpDraftScratch(attemptId);
    } catch (error) {
      console.error('Failed to clear follow-up draft from localStorage', error);
    }
    setDraft(null);
  }, [attemptId]);

  return {
    draft,
    isLoading: false,
    saveDraft,
    clearDraft,
  };
}
