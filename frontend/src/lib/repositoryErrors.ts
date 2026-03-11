import { ApiError } from '@/lib/api';

const REPO_NOT_DETECTED_PATTERNS = [
  /invalid repository/i,
  /could not find repository/i,
  /not a git repository/i,
  /no such file or directory/i,
];

export function isUnderlyingRepoNotDetectedError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  if (!(error instanceof ApiError)) {
    return REPO_NOT_DETECTED_PATTERNS.some((pattern) =>
      pattern.test(error.message)
    );
  }

  if (!error.statusCode || error.statusCode < 400) {
    return false;
  }

  return REPO_NOT_DETECTED_PATTERNS.some((pattern) =>
    pattern.test(error.message)
  );
}
