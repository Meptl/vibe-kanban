# Lazy Diff Loading
The diff experience streams file metadata first and loads full file content lazily, so large attempts render quickly while preserving accurate summary counts.

## Metadata-First Diff Stream
The diff WebSocket now sends only per-file metadata without file bodies, which keeps payloads small and avoids whole-diff content generation on initial load.

The metadata stream is produced by [[crates/services/src/services/diff_stream.rs#create]] and consumed in [[frontend/src/components/panels/DiffsPanel.tsx#DiffsPanel]].

## On-Demand File Content Fetch
Full text for a file is fetched only when needed through a dedicated per-file API endpoint, so backend diff computation stays scoped to the requested path.

The API is implemented in [[crates/server/src/routes/task_attempts.rs#get_task_attempt_diff_file]] and used from [[frontend/src/lib/api.ts#attemptsApi]].
The frontend now treats this fetch as the point where per-file stats processing is complete, including omitted files such as binaries.
Diff cards keep stats empty until parsed/fetched values exist, and show a warning icon with hover text for binary/non-text files only after this processing completes.

When path filters are provided, the Git CLI staging step also scopes to those paths so per-file fetches do not stage the full worktree before diffing.

## Viewport-Triggered Progressive Loading
Diff cards request file content when rows enter the viewport and also when users expand a file, providing progressive loading while scrolling the diff list.

The viewport-triggered behavior is handled by [[frontend/src/components/panels/DiffsPanel.tsx#ViewportAwareRow]].
The card renderer is memoized in [[frontend/src/components/DiffCard.tsx#DiffCard]] to avoid re-rendering unchanged cards as neighboring files finish loading.
Deferred content detection treats both `null` and `undefined` as unloaded content so cards keep showing loading state until full file bodies are fetched.
Timing logs are emitted on backend diff fetch and frontend fetch/parse paths to attribute latency between API work and rendering work.
