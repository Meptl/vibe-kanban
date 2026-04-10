# Codex Thread Resume Compatibility
The Codex executor pins a protocol revision that includes the current `thread/resume` item variants, so follow-up turns decode server history without local compatibility shims.

## Context Compaction Variant Support
The `codex-app-server-protocol` dependency is pinned to commit `b9904c0`, where `ThreadItem` includes `ContextCompaction` but `initialize` does not require `codexHome`, matching older app-server payloads.
