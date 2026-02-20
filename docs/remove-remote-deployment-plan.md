# Plan: Remove Remote Deployment and Cloud Features

## Objective

Remove all remote deployment, cloud hosting, multi-user collaboration, OAuth, organization/team management, and vibekanban.com references from the repository. Convert the application to a purely local-only tool with no cloud features.

## Scope

This plan removes:
- Remote deployment infrastructure and API service
- OAuth authentication (GitHub, Google)
- Organization and team management
- Project sharing and multi-user collaboration
- Shared tasks functionality
- GitHub app integration for PR reviews
- Remote frontend web application
- vibekanban.com references
- Electric database sync for real-time collaboration

## Phase 1: Remove Entire Crates and Directories

### 1.1 Remove Remote Service Crate
**Files:** Entire `crates/remote/` directory (~10,000 lines of Rust code)

**Contents:**
- Remote API service (authentication, organizations, teams, sharing)
- OAuth integration (GitHub, Google)
- GitHub app integration and webhook handlers
- Electric database sync proxy
- Database migrations for remote features
- Docker Compose configuration
- SQLx query cache files

**Action:** Delete entire directory

### 1.2 Remove Deployment Support Crate
**Files:** Entire `crates/deployment/` directory

**Contents:**
- Deployment infrastructure support library
- Only used by remote deployment

**Action:** Delete entire directory

### 1.3 Remove Remote Frontend
**Files:** Entire `remote-frontend/` directory (~2,700 lines of TypeScript)

**Contents:**
- Web-based frontend for hosted vibekanban.com service
- Organization management UI
- Team collaboration interface
- Remote project management

**Action:** Delete entire directory

## Phase 2: Remove GitHub Workflows

### 2.1 Remote Deployment Workflows
**Files:**
- `.github/workflows/remote-deploy-dev.yml`
- `.github/workflows/remote-deploy-prod.yml`

**Action:** Delete both files

## Phase 3: Update Workspace Configuration

### 3.1 Update Root Cargo.toml
**File:** `Cargo.toml`

**Changes:**
- Remove `"crates/remote"` from workspace members
- Remove `"crates/deployment"` from workspace members

### 3.2 Update Package.json Scripts
**File:** `package.json`

**Remove scripts:**
```json
"remote:dev"
"remote:prepare-db"
"remote:prepare-db:check"
```

## Phase 4: Remove Frontend Components and Hooks

### 4.1 Organization Management Components
**Files to delete:**
- `frontend/src/components/dialogs/org/CreateOrganizationDialog.tsx`
- `frontend/src/components/dialogs/org/InviteMemberDialog.tsx`
- `frontend/src/pages/settings/OrganizationSettings.tsx`

### 4.2 Organization-Related Hooks
**Files to delete:**
- `frontend/src/hooks/useOrganizationInvitations.ts`
- `frontend/src/hooks/useOrganizationMembers.ts`
- `frontend/src/hooks/useOrganizationMutations.ts`
- `frontend/src/hooks/useOrganizationProjects.ts`
- `frontend/src/hooks/useOrganizationSelection.ts`
- `frontend/src/hooks/useUserOrganizations.ts`
- `frontend/src/hooks/useProjectRemoteMembers.ts`

### 4.3 Sharing and Collaboration Components
**Files to delete:**
- `frontend/src/components/dialogs/tasks/ShareDialog.tsx`
- `frontend/src/components/dialogs/tasks/StopShareTaskDialog.tsx`
- `frontend/src/components/dialogs/tasks/ViewRelatedTasksDialog.tsx`
- `frontend/src/components/dialogs/projects/LinkProjectDialog.tsx`

### 4.4 Remote API and Auto-Linking Hooks
**Files to delete:**
- `frontend/src/lib/remoteApi.ts`
- `frontend/src/hooks/useAutoLinkSharedTasks.ts`

### 4.5 Hooks with Organization Logic
**Files to review and modify:**
- `frontend/src/hooks/useAssigneeUserName.ts` - Remove organization_id logic

## Phase 5: Remove Internationalization Files

### 5.1 Organization Translation Files
**Files to delete:**
- `frontend/src/i18n/locales/en/organization.json`
- `frontend/src/i18n/locales/es/organization.json`
- `frontend/src/i18n/locales/ja/organization.json`
- `frontend/src/i18n/locales/ko/organization.json`
- `frontend/src/i18n/locales/zh-Hans/organization.json`

## Phase 6: Update Database Schema

### 6.1 Remove Remote-Specific Migrations
**Files to delete from `crates/db/migrations/`:**
- `20251114000000_create_shared_tasks.sql`

**Note:** Review other migrations for `remote_project_id` references

### 6.2 Update Task Model
**File:** `crates/db/src/models/task.rs`

**Remove:**
- `shared_task_id: Option<Uuid>` field
- Methods: `from_shared_task()`, `find_by_shared_task_id()`, `all_shared()`
- All shared task-related queries

### 6.3 Update Project Model
**File:** `crates/db/src/models/project.rs`

**Remove:**
- `remote_project_id: Option<Uuid>` field
- Related queries and methods

## Phase 7: Remove Remote Client Integration

### 7.1 Remove Remote Client Service
**Files to delete:**
- `crates/services/src/services/remote_client.rs`
- `crates/services/src/services/oauth_credentials.rs`

### 7.2 Update Services Module
**File:** `crates/services/src/services/mod.rs`

**Remove:** Exports for `remote_client` and `oauth_credentials`

## Phase 8: Remove vibekanban.com References

### 8.1 Update Review Service
**File:** `crates/review/src/main.rs`

**Remove:** References to `api.vibekanban.com`

### 8.2 Update Git Service
**File:** `crates/services/src/services/git.rs`

**Remove:** `noreply@vibekanban.com` email references

### 8.3 Update Frontend Components
**Files to review:**
- `frontend/src/components/layout/Navbar.tsx` - Remove vibekanban.com doc links
- `frontend/src/components/dialogs/global/DisclaimerDialog.tsx` - Remove vibekanban.com references
- `frontend/src/components/dialogs/global/ReleaseNotesDialog.tsx` - Remove vibekanban.com release notes links

## Phase 9: Update Configuration and Environment

### 9.1 Remove OAuth Configuration
**Remove from all config files and CI:**
- `GITHUB_OAUTH_CLIENT_ID`
- `GITHUB_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `VIBEKANBAN_REMOTE_JWT_SECRET`

### 9.2 Remove Electric Sync Configuration
**File:** `frontend/src/lib/electric/config.ts`

**Review and remove:** Organization_id and remote API references

## Phase 10: Update Shared Types

### 10.1 Regenerate TypeScript Types
**Command:** `pnpm run generate-types`

**Action:** After removing Rust types (organizations, OAuth, shared tasks), regenerate `shared/types.ts`

## Phase 11: Clean Up Documentation

### 11.1 Remove Remote-Specific Documentation
**Files to delete or update:**
- `crates/remote/README.md` - Delete
- `docs/remove-login-functionality-plan.md` - Review and update/delete

### 11.2 Update Repository Guidelines
**File:** `CLAUDE.md`

**Update:**
- Remove references to `crates/remote` and `remote-frontend`
- Remove `remote:prepare-db` commands
- Update project structure documentation

### 11.3 Update Main README
**File:** `README.md` (if exists)

**Update:**
- Remove mentions of cloud deployment
- Remove organization/team features
- Emphasize local-only usage

## Phase 12: Update UI and Navigation

### 12.1 Remove Organization Settings
**Files to review:**
- Settings page navigation - Remove organization settings link
- Main navigation - Remove organization-related menu items

### 12.2 Remove Sharing UI Elements
**Files to review:**
- Task detail views - Remove share/unshare buttons
- Project views - Remove remote linking options
- Toolbar/menus - Remove collaboration features

## Phase 13: Testing and Validation

### 13.1 Build Verification
**Commands to run:**
```bash
pnpm run backend:check
pnpm run check
cargo test --workspace
pnpm run generate-types:check
```

### 13.2 Runtime Testing
**Test scenarios:**
- Launch local dev environment: `pnpm run dev`
- Verify no remote API calls in network inspector
- Create projects and tasks without errors
- Verify all dialogs and components work
- Check that no organization/sharing UI appears

### 13.3 Database Migration Testing
**Test:**
- Fresh database initialization
- Existing database compatibility
- No broken foreign key constraints

## Phase 14: Final Cleanup

### 14.1 Remove Unused Dependencies
**Files to review:**
- `Cargo.toml` files - Remove OAuth, JWT, email, R2/S3 dependencies
- `package.json` - Remove remote API related dependencies

### 14.2 Search for Remaining References
**Commands:**
```bash
rg -i "remote.?project" --type rust --type typescript
rg -i "shared.?task" --type rust --type typescript
rg -i "organization" --type rust --type typescript
rg -i "oauth" --type rust --type typescript
rg -i "vibekanban\.com"
```

## Rollback Plan

If issues arise during removal:
1. This is on a feature branch `vk/7778-remote-deploymen`
2. Can revert individual commits
3. Main branch remains untouched until PR merge
4. Create backup branch before starting: `git branch backup-before-removal`

## Success Criteria

- [ ] All remote/deployment crates removed
- [ ] No compilation errors in Rust workspace
- [ ] No TypeScript type errors in frontend
- [ ] All tests pass
- [ ] `pnpm run dev` successfully launches local-only app
- [ ] No organization, team, or sharing UI visible
- [ ] No OAuth or remote API references
- [ ] No vibekanban.com references (except in old git history)
- [ ] Database migrations work on fresh database
- [ ] Documentation updated to reflect local-only nature

## Estimated Impact

- **Code Removal:** ~13,000 lines (10,000 Rust + 2,700 TypeScript + config)
- **Files Removed:** 60+ files
- **Directories Removed:** 3 major directories
- **Database Tables Removed:** All remote-specific tables
- **Dependencies Removed:** OAuth libraries, JWT, email, S3/R2, Electric sync

## Timeline

This is a comprehensive removal requiring careful execution:
1. **Phase 1-3:** Directory and workspace cleanup
2. **Phase 4-5:** Frontend component removal
3. **Phase 6-7:** Database and service layer updates
4. **Phase 8-9:** Configuration and reference cleanup
5. **Phase 10-12:** Types, docs, and UI cleanup
6. **Phase 13-14:** Testing and final validation

## Dependencies and Blockers

- Must ensure no local features depend on remote infrastructure
- Need to verify all task/project functionality works without `shared_task_id` and `remote_project_id`
- Must maintain database compatibility for existing local users

## Notes

- This converts the application from a hybrid local/cloud tool to purely local
- Removes all multi-user collaboration features
- Simplifies the architecture significantly
- Reduces maintenance burden by eliminating cloud infrastructure
- Aligns with privacy-focused, local-first philosophy
