import { useMutation } from '@tanstack/react-query';
import { attemptsApi } from '@/lib/api';

export interface RetryProcessParams {
  message: string;
  variant: string | null;
  executionProcessId: string;
}

export function useRetryProcess(
  attemptId: string,
  onSuccess?: () => void,
  onError?: (err: unknown) => void
) {
  return useMutation({
    mutationFn: async ({
      message,
      variant,
      executionProcessId,
    }: RetryProcessParams) => {
      // Run retry immediately with default restore behavior.
      await attemptsApi.followUp(attemptId, {
        prompt: message,
        variant,
        retry_process_id: executionProcessId,
        force_when_dirty: false,
        perform_git_reset: true,
      });
    },
    onSuccess: () => {
      onSuccess?.();
    },
    onError: (err) => {
      console.error('Failed to send retry:', err);
      onError?.(err);
    },
  });
}
