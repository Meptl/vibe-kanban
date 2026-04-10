# Codex Thread Resume Compatibility
The Codex executor pins a protocol revision that includes the current `thread/resume` item variants, so follow-up turns decode server history without local compatibility shims.

## Context Compaction Variant Support
The `codex-app-server-protocol` and `codex-protocol` dependencies are pinned to commit `b630ce9` (`rust-v0.118.0`) to match the Codex CLI pin at `@openai/codex@0.118.0`.

## Approvals Reviewer Compatibility
Codex `0.118` adds an optional `approvals_reviewer` field to thread start and resume params, and the executor now sends `None` explicitly so behavior stays aligned with existing approval handling.
