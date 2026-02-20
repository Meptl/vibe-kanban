# Telemetry Removal Plan — vibe-kanban

This document outlines every step required to fully remove PostHog analytics and Sentry error tracking from the vibe-kanban codebase (frontend, backend, remote frontend, remote backend, and CI/CD).

---

## Table of Contents

1. [Overview](#overview)
2. [Frontend — PostHog Removal](#1-frontend--posthog-removal)
3. [Frontend — Sentry Removal](#2-frontend--sentry-removal)
4. [Remote Frontend — PostHog Removal](#3-remote-frontend--posthog-removal)
5. [Backend (Local) — PostHog Removal](#4-backend-local--posthog-removal)
6. [Backend (Local) — Sentry Removal](#5-backend-local--sentry-removal)
7. [Remote Backend — PostHog Removal](#6-remote-backend--posthog-removal)
8. [Shared Types & Config](#7-shared-types--config)
9. [Build System & Environment Variables](#8-build-system--environment-variables)
10. [CI/CD Pipeline](#9-cicd-pipeline)
11. [Final Cleanup & Verification](#10-final-cleanup--verification)

---

## Overview

The repository uses two telemetry services:

| Service | Purpose | Components |
|---------|---------|------------|
| **PostHog** | Product analytics & event tracking | Frontend, Remote Frontend, Backend (local), Remote Backend |
| **Sentry** | Error tracking & performance monitoring | Frontend, Backend (local), Remote Backend |

### Environment Variables to Remove (all locations)

| Variable | Location |
|----------|----------|
| `VITE_POSTHOG_API_KEY` | Frontend |
| `VITE_POSTHOG_API_ENDPOINT` | Frontend |
| `VITE_SENTRY_DSN` | Frontend |
| `VITE_PUBLIC_POSTHOG_KEY` | Remote Frontend |
| `VITE_PUBLIC_POSTHOG_HOST` | Remote Frontend |
| `POSTHOG_API_KEY` | Backend (compile-time) |
| `POSTHOG_API_ENDPOINT` | Backend (compile-time) |
| `SENTRY_DSN` | Backend |
| `SENTRY_DSN_REMOTE` | Remote Backend |
| `SENTRY_AUTH_TOKEN` | CI/CD |
| `SENTRY_ORG` | CI/CD |
| `SENTRY_PROJECT` | CI/CD |

---

## 1. Frontend — PostHog Removal

### 1a. Remove the dependency

**File:** `frontend/package.json`

- Remove `posthog-js` from `dependencies` (currently `^1.276.0`)
- Run `npm install` (or your package manager) to update the lockfile

### 1b. Remove PostHog initialization

**File:** `frontend/src/main.tsx`

- Remove the `import posthog from 'posthog-js'` statement
- Remove the `posthog.init(...)` block that reads `VITE_POSTHOG_API_KEY` and `VITE_POSTHOG_API_ENDPOINT`
- The init block contains configuration for `capture_pageview`, `capture_pageleave`, `capture_performance`, `autocapture`, and `opt_out_capturing_by_default` — remove all of it

### 1c. Remove analytics opt-in/opt-out logic

**File:** `frontend/src/App.tsx`

- Remove `import posthog from 'posthog-js'`
- Remove the `useEffect` block that handles `posthog.identify()`, `posthog.opt_in_capturing()`, and `posthog.opt_out_capturing()` based on `config.analytics_enabled` and `config.analytics_user_id`

### 1d. Remove event tracking calls across frontend pages/components

Search for all `posthog.capture(` calls and remove them from the following files:

| File | Events to Remove |
|------|-----------------|
| `frontend/src/pages/ui-new/LandingPage.tsx` | `remote_onboarding_ui_stage_viewed`, `remote_onboarding_ui_stage_submitted`, `remote_onboarding_ui_stage_completed`, `remote_onboarding_ui_stage_failed` |
| `frontend/src/pages/ui-new/MigratePage.tsx` | Migration stage tracking events |
| `frontend/src/pages/ui-new/OnboardingSignInPage.tsx` | `remote_onboarding_ui_sign_in_provider_clicked`, `remote_onboarding_ui_sign_in_provider_result`, `remote_onboarding_ui_sign_in_more_options_opened` |
| `frontend/src/components/ui-new/scope/NewDesignScope.tsx` | `ui_new_accessed` |
| `frontend/src/components/ui-new/containers/MigrateMigrateContainer.tsx` | Migration stage tracking events |
| `frontend/src/components/ui-new/actions/index.ts` | `posthog.displaySurvey('019bb6e8-3d36-0000-1806-7330cd3c727e')` |

For each file:
- Remove the `import posthog from 'posthog-js'` import
- Remove the `posthog.capture(...)` or `posthog.displaySurvey(...)` calls
- Clean up any variables, callbacks, or `useEffect` blocks that existed only to support these tracking calls

---

## 2. Frontend — Sentry Removal

### 2a. Remove the dependencies

**File:** `frontend/package.json`

- Remove `@sentry/react` (currently `^9.34.0`)
- Remove `@sentry/vite-plugin` (currently `^3.5.0`)
- Run `npm install` to update the lockfile

### 2b. Remove Sentry initialization

**File:** `frontend/src/main.tsx`

- Remove the `import * as Sentry from '@sentry/react'` statement
- Remove the `Sentry.init({...})` block that configures:
  - `dsn` from `VITE_SENTRY_DSN`
  - `reactRouterV6BrowserTracingIntegration`
  - `tracesSampleRate: 1.0`
  - Source tag `'frontend'`

### 2c. Remove Sentry error boundary

**File:** `frontend/src/main.tsx` (or wherever the root render is)

- Remove the `Sentry.ErrorBoundary` wrapper around the app's root component
- Remove any `fallback` component and `showDialog` prop associated with it
- Keep the inner app component rendering intact

### 2d. Remove Sentry Vite plugin

**File:** `frontend/vite.config.ts`

- Remove the `import` for `@sentry/vite-plugin`
- Remove the Sentry plugin entry from the `plugins` array (this handles source map uploads during build)

---

## 3. Remote Frontend — PostHog Removal

### 3a. Remove the dependency

**File:** `remote-frontend/package.json`

- Remove `posthog-js` (currently `^1.283.0`)
- Run `npm install` to update the lockfile

### 3b. Remove PostHog initialization

**File:** `remote-frontend/src/main.tsx`

- Remove the `import posthog from 'posthog-js'` statement
- Remove the `posthog.init(...)` block that reads `VITE_PUBLIC_POSTHOG_KEY` and `VITE_PUBLIC_POSTHOG_HOST`

### 3c. Remove environment variable templates

**File:** `remote-frontend/.env.production.example`

- Remove the `VITE_PUBLIC_POSTHOG_KEY` entry
- Remove the `VITE_PUBLIC_POSTHOG_HOST` entry

### 3d. Search for and remove any tracking calls

- Grep for `posthog.capture`, `posthog.identify`, `posthog.opt_in`, `posthog.opt_out` in all `remote-frontend/src/` files and remove any found

---

## 4. Backend (Local) — PostHog Removal

### 4a. Remove the analytics service

**File:** `crates/services/src/services/analytics.rs`

This is the core analytics module. It contains:
- `AnalyticsService` struct with PostHog HTTP client
- `track_event()` method for sending events
- `generate_user_id()` — generates a machine-specific anonymous ID using:
  - macOS: `ioreg` hardware UUID
  - Linux: `/etc/machine-id`
  - Windows: Registry `MachineGuid` via PowerShell
- Device info collection (OS type, version, architecture, bitness)

**Action:** Delete this file entirely, or gut its contents. If other code depends on `AnalyticsService` as a type, you'll need to either remove all references or replace it with a no-op stub during the transition.

### 4b. Remove analytics from service module exports

**File:** `crates/services/src/services/mod.rs` (or equivalent module declaration)

- Remove the `pub mod analytics;` line
- Remove any re-exports of `AnalyticsService`

### 4c. Remove analytics from local deployment setup

**File:** `crates/local-deployment/src/lib.rs`

- Remove the `AnalyticsService` initialization
- Remove any passing of the analytics service to the server/router

### 4d. Remove event tracking calls from route handlers

The following route handlers contain `analytics.track_event(...)` or `track_if_analytics_allowed(...)` calls:

| File | Events |
|------|--------|
| `crates/server/src/routes/config.rs` | `onboarding_disclaimer_accepted`, `onboarding_completed`, `analytics_session_start` |
| `crates/server/src/routes/oauth.rs` | `analytics_session_start` |
| `crates/server/src/routes/approvals.rs` | `approval_responded` |
| `crates/server/src/routes/agents.rs` | `agent_setup_script_executed` |
| `crates/server/src/routes/workspaces.rs` | `workspace_created_and_started`, `workspace_created_from_pr`, `workspace_deleted`, `task_attempt_merged`, `task_attempt_editor_opened`, `task_attempt_target_branch_changed`, `task_attempt_branch_renamed`, `task_attempt_rebased`, `task_attempt_stopped` |
| `crates/server/src/routes/pull_requests.rs` | `pr_created` |
| `crates/server/src/routes/repos.rs` | `repo_editor_opened` |
| `crates/server/src/routes/tags.rs` | `tag_created`, `tag_updated` |
| `crates/server/src/routes/follow_ups.rs` | `follow_up_queued`, `follow_up_queue_cancelled` |
| `crates/server/src/routes/sessions.rs` | `session_review_started` |
| `crates/server/src/routes/dev_server.rs` | `dev_server_started` |
| `crates/server/src/routes/images.rs` | `image_uploaded` |
| `crates/server/src/routes/scripts.rs` | `cleanup_script_executed`, `archive_script_executed`, `setup_script_executed`, `gh_cli_setup_executed` |
| `crates/server/src/routes/organizations.rs` | `organization_created`, `invitation_created` |
| `crates/server/src/main.rs` | `session_start` |

For each file:
- Remove the `use` import for the analytics service
- Remove the `analytics.track_event(...)` or `track_if_analytics_allowed(...)` calls
- Remove any analytics-related function parameters (e.g., `analytics: &AnalyticsService`)
- Clean up any variables that existed solely for building analytics event properties

### 4e. Remove compile-time environment variable injection

**File:** `crates/server/build.rs`

- Remove the lines that read and emit `POSTHOG_API_KEY` and `POSTHOG_API_ENDPOINT` as compile-time constants (e.g., `println!("cargo:rustc-env=...")`)

---

## 5. Backend (Local) — Sentry Removal

### 5a. Remove the Sentry module

**File:** `crates/utils/src/sentry.rs`

This contains:
- `SentrySource` enum (`Backend`, `Mcp`, `Remote`)
- `init_once()` — one-time Sentry initialization
- `configure_user_scope()` — sets user context
- `sentry_layer()` — tracing layer that converts log levels to Sentry breadcrumbs/events

**Action:** Delete this file entirely.

### 5b. Remove Sentry from utility module exports

**File:** `crates/utils/src/lib.rs` (or equivalent)

- Remove `pub mod sentry;`
- Remove any re-exports

### 5c. Remove Sentry Cargo dependencies

**File:** `crates/server/Cargo.toml`

- Remove `sentry = "0.41.0"` from `[dependencies]`

**File:** `crates/utils/Cargo.toml`

- Remove `sentry = "0.41.0"` from `[dependencies]`
- Remove `sentry-tracing = "0.41.0"` from `[dependencies]`

### 5d. Remove Sentry initialization from entry points

**File:** `crates/server/src/main.rs` (and any other entry points)

- Remove `sentry::init_once(...)` calls
- Remove `sentry::configure_user_scope(...)` calls
- Remove `sentry::sentry_layer()` from the tracing subscriber setup
- Remove `_sentry_guard` variables (Sentry keeps a guard to flush on shutdown)

---

## 6. Remote Backend — PostHog Removal

### 6a. Remove the remote analytics service

**File:** `crates/remote/src/analytics.rs`

Similar to the local analytics service but uses UUID-based user tracking. Contains:
- `AnalyticsService::track()` — takes `user_id: UUID`, event name, and properties
- Special handling for `$identify` events with `$set` properties
- All events tagged with `source: "remote"`

**Action:** Delete this file entirely.

### 6b. Remove from remote module

**File:** `crates/remote/src/mod.rs` or similar

- Remove `pub mod analytics;`

### 6c. Remove analytics initialization from remote app

**File:** `crates/remote/src/app.rs`

- Remove `AnalyticsService` initialization and injection

**File:** `crates/remote/src/main.rs`

- Remove any analytics-related setup code

### 6d. Remove tracking calls from remote route handlers

- Grep for `analytics.track(` across all files in `crates/remote/src/` and remove all tracking calls and associated imports/parameters

---

## 7. Shared Types & Config

### 7a. Remove analytics fields from Config type

Locate the shared `Config` struct (likely in a shared types crate or the server crate):

- Remove the `analytics_enabled: bool` field
- Remove the `analytics_user_id: String` field from `UserSystemInfo`

### 7b. Remove frontend config consumption

After removing the backend fields, the frontend will also need updates:

- Remove any references to `config.analytics_enabled` and `config.analytics_user_id` in frontend code
- Remove any analytics settings UI (toggle switches, consent dialogs, etc.) if present

### 7c. Remove TypeScript types

- Search for and remove any TypeScript interfaces/types referencing `analytics_enabled` or `analytics_user_id`

---

## 8. Build System & Environment Variables

### 8a. Backend build scripts

**File:** `crates/server/build.rs`

- Remove `POSTHOG_API_KEY` environment variable reading/emission
- Remove `POSTHOG_API_ENDPOINT` environment variable reading/emission
- If these were the only lines in `build.rs`, you may be able to remove the file and the `build = "build.rs"` line from the crate's `Cargo.toml`

### 8b. Dockerfiles

Search all Dockerfiles in the repo for:
- `ARG POSTHOG_API_KEY`
- `ARG POSTHOG_API_ENDPOINT`
- `ARG SENTRY_DSN`
- `ARG SENTRY_DSN_REMOTE`
- `ENV VITE_PUBLIC_POSTHOG_KEY`
- `ENV VITE_PUBLIC_POSTHOG_HOST`
- `ENV VITE_SENTRY_DSN`

Remove all of these build args and environment variable declarations.

### 8c. Environment example files

- Remove telemetry variables from any `.env.example`, `.env.production.example`, `.env.development.example` files

---

## 9. CI/CD Pipeline

**File:** `.github/workflows/pre-release.yml`

### 9a. Remove Sentry release steps

- Remove the `getsentry/action-release@v3` step (Sentry release creation)
- Remove the `matbour/setup-sentry-cli@v2` step (Sentry CLI installation)
- Remove the `sentry-cli debug-files upload --include-sources` step (source map upload)
- Remove references to secrets: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`

### 9b. Remove PostHog build args

- Remove the `POSTHOG_API_KEY` and `POSTHOG_API_ENDPOINT` Docker build args
- Remove the `VITE_PUBLIC_POSTHOG_KEY` and `VITE_PUBLIC_POSTHOG_HOST` environment variables

### 9c. Remove Sentry DSN from build

- Remove `SENTRY_DSN` and `SENTRY_DSN_REMOTE` from any CI build arg or env steps

### 9d. Check other workflow files

- Search `.github/workflows/` for any other files referencing Sentry, PostHog, or telemetry secrets and clean them up

---

## 10. Final Cleanup & Verification

### 10a. Search for remaining references

Run these searches across the entire repository to catch anything missed:

```bash
# PostHog references
grep -r "posthog" --include="*.rs" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" --include="*.toml" --include="*.yml" --include="*.yaml" --include="*.env*" --include="Dockerfile*"

# Sentry references
grep -r "sentry" --include="*.rs" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" --include="*.toml" --include="*.yml" --include="*.yaml" --include="*.env*" --include="Dockerfile*"

# Analytics references (broader sweep)
grep -r "analytics" --include="*.rs" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" --include="*.toml"

# Telemetry env vars
grep -r "POSTHOG\|SENTRY" --include="*.rs" --include="*.ts" --include="*.tsx" --include="*.env*" --include="*.yml" --include="*.yaml" --include="Dockerfile*" --include="*.toml"
```

### 10b. Build verification

```bash
# Frontend
cd frontend && npm install && npm run build

# Remote Frontend
cd remote-frontend && npm install && npm run build

# Backend
cargo build --workspace
```

### 10c. Test verification

```bash
# Run all tests to ensure nothing breaks
cargo test --workspace
cd frontend && npm test
```

### 10d. Lockfile updates

- Ensure `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml` are regenerated for both `frontend/` and `remote-frontend/`
- Run `cargo update` if needed to clean up unused transitive dependencies

### 10e. Remove GitHub secrets (manual)

After deploying, remove these secrets from the GitHub repository settings:
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_DSN`
- `SENTRY_DSN_REMOTE`
- `POSTHOG_API_KEY`
- `POSTHOG_API_ENDPOINT`

---

## Summary Checklist

- [ ] **Frontend:** Remove `posthog-js` dependency and all tracking calls (6+ files)
- [ ] **Frontend:** Remove `@sentry/react` and `@sentry/vite-plugin` and all init/boundary code
- [ ] **Remote Frontend:** Remove `posthog-js` dependency and initialization
- [ ] **Backend Local:** Delete `crates/services/src/services/analytics.rs` and remove all `track_event` calls (~15 route files)
- [ ] **Backend Local:** Delete `crates/utils/src/sentry.rs` and remove Sentry Cargo deps
- [ ] **Remote Backend:** Delete `crates/remote/src/analytics.rs` and remove all tracking calls
- [ ] **Shared Types:** Remove `analytics_enabled` and `analytics_user_id` from config structs
- [ ] **Build System:** Clean `build.rs`, Dockerfiles, and `.env` templates
- [ ] **CI/CD:** Remove Sentry release steps and PostHog build args from GitHub Actions
- [ ] **Verify:** Grep for remaining references, build all targets, run all tests
- [ ] **Deploy:** Remove GitHub repository secrets
