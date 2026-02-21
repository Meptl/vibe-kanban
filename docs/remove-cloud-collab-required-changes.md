# Required Changes: Remove Remaining Cloud/Collab Integrations

This document lists the remaining cloud/collaboration-related code that still exists and the required changes to fully remove it.

## Goal

Convert the codebase to local-only behavior by removing:

- GitHub PR/comment integrations
- GH CLI setup flows
- Remote project linking endpoints/types
- Organization/OAuth/shared-workspace artifacts
- Share publisher and remote config scaffolding

## Execution Order (recommended)

1. Remove server API surface (routes + handlers) for PR/GH setup and remote linking.
2. Remove service-layer GitHub/share modules and deployment wiring.
3. Remove DB/model/type fields related to remote/share.
4. Remove frontend dialogs/hooks/components/settings tied to PR/comments/orgs.
5. Remove i18n namespaces/keys no longer used.
6. Regenerate shared types and run checks.

## 1) Backend API routes to remove

### Task attempt PR/GitHub endpoints

Remove these mounted routes from `crates/server/src/routes/task_attempts.rs`:

- `/gh-cli-setup`
- `/pr`
- `/pr/attach`
- `/pr/comments`

Then delete related handlers/modules:

- `crates/server/src/routes/task_attempts/gh_cli_setup.rs`
- `crates/server/src/routes/task_attempts/pr.rs`

Also remove `pub mod gh_cli_setup;` and any `pr::...` usages/imports in `crates/server/src/routes/task_attempts.rs`.

### Projects remote-link endpoints

Remove these remote-linking routes from `crates/server/src/routes/projects.rs`:

- `/{id}/remote/members`
- `/{id}/link`
- `/{id}/link/create`
- `/remote-projects/{remote_project_id}`

Delete now-local-mode-only handlers:

- `link_project_to_existing_remote`
- `create_and_link_remote_project`
- `unlink_project`
- `get_remote_project_by_id`
- `get_project_remote_members`

Remove unneeded request/response types there:

- `LinkToExistingRequest`
- `CreateRemoteProjectRequest`

## 2) Backend service/deployment cleanup

### GitHub integration service

If PR integration is fully out of scope, remove:

- `crates/services/src/services/github.rs`
- `crates/services/src/services/github/cli.rs`
- `crates/server/src/error.rs` mapping branches for `GitHubServiceError`
- `GitHubService` usages in server routes and `crates/services/src/services/git.rs` helper call sites

Also remove GitHub-related config model fields if no longer needed (see section 4).

### Share/remote scaffolding

Remove share publisher and remote-config plumbing:

- `crates/services/src/services/share.rs`
- `crates/services/src/services/share/config.rs`
- `crates/services/src/services/share/publisher.rs`
- share hooks in:
  - `crates/local-deployment/src/lib.rs`
  - `crates/local-deployment/src/container.rs`
  - `crates/services/src/services/container.rs`
  - `crates/server/src/main.rs` (shared task cleanup background job)
  - `crates/server/src/routes/task_attempts.rs`

Remove remote env/build pass-through:

- `crates/server/build.rs` (`VK_SHARED_API_BASE` handling)

## 3) Data model and DB changes

### Rust models still carrying remote/share fields

Remove fields and references:

- `crates/db/src/models/project.rs`
  - `remote_project_id`
- `crates/db/src/models/task.rs`
  - `shared_task_id` in `Task`
  - `shared_task_id` in `CreateTask`
  - any fallback/default handling around this field

### Migrations sanity

There is already a cleanup migration:

- `crates/db/migrations/20251221000000_cleanup_local_shared_remote_columns.sql`

Required action:

- Verify current schema no longer expects dropped columns.
- Ensure SQLx queries and `FromRow` structs match post-cleanup schema.

## 4) Config/type cleanup

### Remove GitHub/PR config surface (if fully out of scope)

Clean up from config models and settings:

- `crates/services/src/services/config/mod.rs`
- `crates/services/src/services/config/versions/*`
- `shared/types.ts` (generated)
- `frontend/src/pages/settings/GeneralSettings.tsx` (Pull Requests section)

Likely removable fields:

- `github` (`GitHubConfig`)
- `pr_auto_description_enabled`
- `pr_auto_description_prompt`
- `DEFAULT_PR_DESCRIPTION_PROMPT` export and usage

### Remove cloud/collab API type modules in utils

Delete/stop exporting:

- `crates/utils/src/api/oauth.rs`
- `crates/utils/src/api/organizations.rs`
- `crates/utils/src/api/projects.rs` remote org-member types
- module exports in `crates/utils/src/api/mod.rs`

## 5) Frontend cleanup

### Remove PR/GitHub dialogs and hooks

Remove unused/orphaned PR/comment UI:

- `frontend/src/components/dialogs/tasks/CreatePRDialog.tsx`
- `frontend/src/components/dialogs/tasks/GitHubCommentsDialog.tsx`
- `frontend/src/components/dialogs/auth/GhCliSetupDialog.tsx`
- `frontend/src/hooks/usePrComments.ts`
- `frontend/src/components/ui/github-comment-card.tsx`
- `frontend/src/components/ui/wysiwyg/nodes/github-comment-node.tsx` and related transformers in `frontend/src/components/ui/wysiwyg.tsx`

Remove corresponding API client calls from `frontend/src/lib/api.ts`:

- `attemptsApi.createPR`
- `attemptsApi.setupGhCli`
- `attemptsApi.getPrComments`

### Remove org/remote project components

Remove remaining org components:

- `frontend/src/components/org/RemoteProjectItem.tsx`
- `frontend/src/components/org/PendingInvitationItem.tsx`
- `frontend/src/components/org/MemberListItem.tsx`

### Remove residual shared-task UI shell

Current `useProjectTasks` returns empty shared maps but shared UI shell still exists.

Remove shared-only presentation paths and types:

- `frontend/src/hooks/useProjectTasks.ts`
  - `SharedTaskRecord`
  - `sharedTasksById`, `sharedOnlyByStatus` return shape
- `frontend/src/pages/ProjectTasks.tsx`
  - shared task panel/card flows
  - `selectedSharedTaskId`, `showSharedTasks`, `shared` query-param behavior
- `frontend/src/components/tasks/SharedTaskCard.tsx`
- `frontend/src/components/panels/SharedTaskPanel.tsx`
- shared-task conditionals in:
  - `frontend/src/components/tasks/TaskKanbanBoard.tsx`
  - `frontend/src/components/tasks/TaskCard.tsx`
  - `frontend/src/components/ui/actions-dropdown.tsx`
  - `frontend/src/components/panels/TaskPanelHeaderActions.tsx`
  - `frontend/src/components/panels/AttemptHeaderActions.tsx`

## 6) i18n and docs cleanup

### i18n namespaces/keys

Remove unused namespace loading and files:

- `frontend/src/i18n/config.ts`: remove `organization` namespace imports/resources
- `frontend/src/i18n/locales/*/organization.json`

Prune unused keys from:

- `frontend/src/i18n/locales/*/tasks.json` (GitHub comments / PR dialog blocks)
- `frontend/src/i18n/locales/*/settings.json` (GitHub CLI integration blocks if removed)
- `frontend/src/i18n/locales/*/projects.json` (remote/org linking copy)
- `frontend/src/i18n/locales/*/common.json` (org switcher/oauth copy)

### Product docs

Remove outdated feature docs mentioning PR/org/cloud collaboration:

- `docs/integrations/github-integration.mdx`
- sections in `docs/core-features/completing-a-task.mdx`
- related references in `docs/getting-started.mdx` and `docs/docs.json`

## 7) Type generation + validation

After backend type/model cleanup:

1. Run `pnpm run generate-types`
2. Run `pnpm run check`
3. Run `pnpm run backend:check`
4. Run `cargo test --workspace` (or targeted tests first)

## 8) Acceptance criteria

- No `/api/task-attempts/:id/pr*` routes.
- No `/api/task-attempts/:id/gh-cli-setup` route.
- No project remote-linking routes.
- No GitHub CLI setup UI or PR/comment dialogs.
- No org/organization UI/components/i18n namespace.
- No `remote_project_id` / `shared_task_id` in runtime API models.
- No share publisher/background shared-task sync path in local deployment.
- `shared/types.ts` regenerated and free of removed cloud/collab types.

