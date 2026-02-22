import type { ExecutorAction, ExecutorProfileId } from 'shared/types';

export function extractProfileFromAction(
  action: ExecutorAction | null
): ExecutorProfileId | null {
  let curr: ExecutorAction | null = action;
  while (curr) {
    const typ = curr.typ;
    switch (typ.type) {
      case 'CodingAgentInitialRequest':
      case 'CodingAgentFollowUpRequest':
        return typ.executor_profile_id;
      case 'ScriptRequest':
      default:
        curr = curr.next_action;
        continue;
    }
  }
  return null;
}
