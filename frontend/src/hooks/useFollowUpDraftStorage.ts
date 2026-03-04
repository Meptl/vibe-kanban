import { useCallback, useEffect, useState } from 'react';
import type { DraftFollowUpData } from 'shared/types';
import { draftApi } from '@/lib/api';

export function useFollowUpDraftStorage(attemptId?: string) {
  const [draft, setDraft] = useState<DraftFollowUpData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (!attemptId) {
      setDraft(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    draftApi
      .get(attemptId)
      .then((nextDraft) => {
        if (mounted) {
          setDraft(nextDraft);
        }
      })
      .catch((error) => {
        console.error('Failed to load follow-up draft', error);
        if (mounted) {
          setDraft(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [attemptId]);

  const saveDraft = useCallback(
    async (nextDraft: DraftFollowUpData) => {
      if (!attemptId) return;
      try {
        await draftApi.save(attemptId, nextDraft);
        setDraft(nextDraft);
      } catch (error) {
        console.error('Failed to save follow-up draft', error);
      }
    },
    [attemptId]
  );

  const clearDraft = useCallback(async () => {
    if (!attemptId) {
      setDraft(null);
      return;
    }

    try {
      await draftApi.clear(attemptId);
    } catch (error) {
      console.error('Failed to clear follow-up draft', error);
    }
    setDraft(null);
  }, [attemptId]);

  return {
    draft,
    isLoading,
    saveDraft,
    clearDraft,
  };
}
