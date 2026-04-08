# Settings Storage Topology

This section defines where each class of settings is persisted and why storage is split across files, SQLite, and browser-local state.

## File-Backed User Config

Global user preferences are stored in `asset_dir()/config.json` and executor profile overrides in `asset_dir()/profiles.json`, so they can be loaded before project records.

The backend resolves `asset_dir()` to `dev_assets` in debug builds and to the platform app-data directory in production. This keeps user config portable across launches without coupling it to any single project row.

## API Boundary For Config Files

The frontend reads and writes config through backend routes instead of direct file access so validation, migrations, and runtime cache updates happen in one place.

`/api/info` returns the current merged runtime view, while `/api/config` validates and persists `config.json` updates. `/api/profiles` does the same for profile overrides, and `/api/mcp-config` updates agent-specific MCP config files.

## Database-Backed Project Settings

Project-scoped settings are stored in the `projects` table because they are relational data tied to project identity and task execution behavior.

These fields include `git_repo_path`, `setup_script`, `dev_script`, `cleanup_script`, `copy_files`, and `parallel_setup_script`. This is why project settings are accessed through project APIs rather than through `config.json`.

## Database-Backed Tags

Tag definitions are persisted in the `tags` table so they can be global or project-specific and be queried consistently by the API.

`tags.project_id` is nullable, allowing global tags when null and project-scoped tags when set. This model supports reuse and filtering without duplicating tag text in `config.json`.

## Browser-Local UI State

Ephemeral UI preferences are stored in browser `localStorage` because they are view-state concerns, not shared application configuration.

Examples include task layout panel sizes and whether the todo panel is expanded. These values are intentionally not persisted in backend files or the SQLite database.
