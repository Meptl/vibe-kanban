# Upstream Bug Fixes from v0.0.136-20251215225138 to origin/main

This document lists bug fixes and workflow improvements from upstream, excluding:
- New UI redesigns
- Multi-repo/workspace features
- Kanban/project management features

## Critical Bug Fixes for Commit Workflow

### Approval & Execution Fixes (High Priority)

**d401ffe1** - Fix approval matching bug where approval prompts would timeout instead of showing
- File: `crates/executors/src/executors/codex/normalize_logs.rs`
- Issue: ExecApprovalRequest with empty call_id caused find_matching_tool_use() to fail
- Fix: Set call_id on CommandState in ExecApprovalRequest handler

**44abb991** - Fix stop button not working during approval mode
- Files: Multiple executor and approval files
- Issue: Stop button was non-functional during approval flows
- Fix: Add CancellationToken support to executor approval flow, implement graceful shutdown

**6a307b66** - Stop Claude Code on approval timeout, increase default timeout to 10 hours
- Files: `crates/executors/src/executors/claude/client.rs`, `crates/utils/src/approvals.rs`
- Issue: Agent would hang on approval timeout
- Fix: Properly stop process on timeout, increase default from lower value to 10 hours

**be61638e** - Fix apply_patch approvals not showing approve/reject buttons
- File: `crates/executors/src/executors/codex/normalize_logs.rs`
- Issue: Race condition where approval service couldn't find entries
- Fix: Update entries in place instead of removing and recreating them

**a4356294** - Add Codex commit reminders and streamline workspace tooling
- Files: `crates/executors/src/executors/codex/client.rs`, `crates/utils/src/git.rs`
- Feature: Prevents agent from exiting with uncommitted changes
- Fix: Consolidated git status checking into shared utils, added commit reminder flow

### Git Operation Fixes (High Priority)

**ce5b48bf** - Pass git errors to frontend with actionable messages
- File: `crates/server/src/error.rs`
- Issue: Generic "internal error" for all git errors
- Fix: Specific error messages with user guidance (e.g., "suggest rebasing before retrying merge")

**8710c24b** - Clean up broken workspace on PR checkout failure
- Files: `crates/server/src/routes/task_attempts/pr.rs`, frontend command bar
- Issue: Orphaned workspaces when PR checkout fails
- Fix: Delete DB records synchronously, spawn background filesystem cleanup

**062a68ec** - Fix resolve conflicts dialog appearing for wrong workspace on switch
- Files: `frontend/src/components/ui-new/dialogs/RebaseDialog.tsx` and related
- Issue: Dialog shows for wrong workspace when switching workspaces
- Fix: Guard dialog with activeWorkspaceId check, add defensive self-dismiss

**47dfcb16** - Don't classify >/dev/null and fd as edit commands
- Issue: False positives in command classification
- Fix: Better command detection logic

### Process & Performance Fixes (Medium Priority)

**5676a483** - Fix Opencode process leak
- Files: `crates/executors/src/executors/opencode.rs`, `crates/utils/src/process.rs`
- Issue: Memory leaks on Linux from processes not being killed on drop
- Fix: Explicitly kill opencode process on drop, add shared process utils

**410ab07f** - Handle signature_delta in Claude streaming to suppress mismatch warning
- Issue: Noisy warnings in logs during Claude streaming
- Fix: Properly handle signature_delta message type

**4c0b4f8d** - Remount execution process provider on workspace/session switch
- Issue: Stale process state when switching workspaces
- Fix: Remount provider to refresh state

**ff1a517b** - Fix duplicate workspace prompt recovery from executor actions
- Issue: Duplicate prompts appearing in workspace
- Fix: Proper deduplication in prompt recovery

**292f8dd2** - Suppress codex_core tracing output from server logs
- Issue: Excessive logging from codex_core
- Fix: Filter noisy tracing output

### UI/UX Workflow Improvements (Medium Priority)

**f63dff75** - Fix typeahead menu jumping during typing
- Issue: Menu position jumps while user is typing
- Fix: Improved edge detection and positioning

**916c79ba** - Prevent conversation entries from overlapping on follow-up messages
- Issue: Entries render overlapping after historic data updates
- Fix: Preserve measured item sizes in Virtuoso, use ScrollToBottomModifier

**d7830bdd** - Deduplicate consecutive patches in historical normalized log streaming
- Issue: Duplicate patches shown in logs
- Fix: Deduplication logic for consecutive patches

**7765955a** - Don't spam SQLite with workspace timestamp updates
- File: Database timestamp handling
- Issue: Excessive database writes for timestamp updates
- Fix: Rate limit or batch timestamp updates

### Token/Auth Fixes (Medium Priority)

**cf49189e** - Refresh token fixes
- Issue: Token refresh not working properly
- Fix: Improved token refresh handling

**d2bc8b2a** - Polyfill crypto.randomUUID for non-secure contexts
- Issue: crypto.randomUUID unavailable in non-HTTPS contexts
- Fix: Add polyfill for compatibility

**02432390** - Fallback when crypto.randomUUID is unavailable
- Issue: Crashes when crypto.randomUUID missing
- Fix: Provide fallback implementation

### Minor But Useful Fixes (Low Priority)

**907152ee** - Downgrade diff stream repo-not-found error to warning
- Issue: Errors logged for expected conditions
- Fix: Change log level from error to warning

**7a2bf1df** - Skip cache build for non-existent repo paths instead of logging error
- Issue: Error logs for expected missing paths
- Fix: Skip silently instead of logging error

**f10b264d** - Gracefully handle missing Linux notification daemon
- Issue: Crashes when notification daemon unavailable
- Fix: Graceful fallback when daemon missing

**cb035c09** - Remove package-lock.json to suppress VSC warnings
- Issue: VSCode warnings about package-lock
- Fix: Remove file (project uses pnpm)

**caa003d3** - Fix React hot reload
- Issue: Hot reload not working properly
- Fix: Proper HMR configuration

## Agent Version Bumps (Recommended)

**33913c5e** - Bump Claude Code to 2.1.45 and handle new message types
- Update Claude Code SDK to latest version with new message type support

**3af5f3b5** - Bump codex version to 0.101.0 and filter noisy stderr
- Update Codex dependencies, filter unnecessary stderr output

**2971a3be** - Bump Claude Code to 2.1.41 and filter noisy fast mode stderr warning
- Update Claude Code SDK, suppress fast mode warnings

## Recommended Cherry-pick Order

1. **Critical Approval/Execution Fixes** (do these together to avoid conflicts):
   - d401ffe1 (approval matching)
   - 44abb991 (stop button)
   - 6a307b66 (approval timeout)
   - be61638e (apply_patch approvals)
   - a4356294 (commit reminders)

2. **Git Operation Fixes**:
   - ce5b48bf (git error messages)
   - 8710c24b (PR checkout cleanup)
   - 062a68ec (resolve conflicts dialog)
   - 47dfcb16 (command classification)

3. **Process/Performance Fixes**:
   - 5676a483 (process leak)
   - 410ab07f (signature_delta)
   - 4c0b4f8d (process provider remount)
   - ff1a517b (duplicate prompts)
   - 292f8dd2 (suppress tracing)

4. **UI/UX Improvements**:
   - f63dff75 (typeahead jumping)
   - 916c79ba (overlapping entries)
   - d7830bdd (deduplicate patches)
   - 7765955a (timestamp spam)

5. **Auth/Token Fixes**:
   - cf49189e (refresh token)
   - d2bc8b2a (crypto polyfill)
   - 02432390 (crypto fallback)

6. **Minor Fixes**:
   - 907152ee, 7a2bf1df, f10b264d, cb035c09, caa003d3

7. **Agent Version Bumps** (last, to get latest stable versions):
   - 33913c5e, 3af5f3b5, 2971a3be

## Cherry-pick Commands

```bash
# Critical approval/execution fixes
git cherry-pick d401ffe1 44abb991 6a307b66 be61638e a4356294

# Git operation fixes
git cherry-pick ce5b48bf 8710c24b 062a68ec 47dfcb16

# Process/performance fixes
git cherry-pick 5676a483 410ab07f 4c0b4f8d ff1a517b 292f8dd2

# UI/UX improvements
git cherry-pick f63dff75 916c79ba d7830bdd 7765955a

# Auth/token fixes
git cherry-pick cf49189e d2bc8b2a 02432390

# Minor fixes
git cherry-pick 907152ee 7a2bf1df f10b264d cb035c09 caa003d3

# Agent version bumps
git cherry-pick 33913c5e 3af5f3b5 2971a3be
```

## Notes

- Some commits may have dependencies or conflicts - resolve carefully
- Test after each group of cherry-picks
- The agent version bumps should be done last to ensure compatibility
- Skip any commits that conflict with intentional changes in this branch
