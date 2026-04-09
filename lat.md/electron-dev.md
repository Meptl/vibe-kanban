# Electron Development Runtime

This section documents how the desktop shell behaves during local development so runtime behavior is predictable when debugging startup and backend issues.

## Backend Log Forwarding

The Electron main process forwards backend stdout and stderr to the parent terminal so developers can see normal runtime logs while startup URL detection still works.

The forwarding is implemented in `electron/main.cjs` inside `spawnBackend`.

## Rustup Proxy Env Sanitization

The Electron launcher and backend startup remove `RUSTUP_FORCE_ARG0` and `ARGV0` so rustup proxy binaries keep working in app-launched terminals and agent subprocesses.

`electron/main.cjs` deletes these variables in `spawnBackend`, and `crates/server/src/main.rs` clears them again at backend startup. The editor launcher in `crates/services/src/services/config/editor/mod.rs` also strips AppImage vars and AppDir path entries before opening local IDEs.
