# Merge Dirty Worktree Blocking

This section documents merge behavior when the base branch is checked out with local edits in its worktree.

## Blocking Rule

When `[[crates/services/src/services/git.rs#GitService#merge_changes]]` runs against a checked-out base branch, tracked local edits must be committed or stashed first.

The service now returns a dirty-worktree error instead of creating a synthetic chore commit, so merges stay blocked until the user resolves local edits explicitly.

## User Warning

The API surfaces merge blocking due to tracked local edits as a conflict response so clients can present an explicit warning before retry.

`[[crates/server/src/error.rs#ApiError#into_response]]` maps `WorktreeDirty` to HTTP 409 and includes a user-facing message that asks for commit or stash before merge.
