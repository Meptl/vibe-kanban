# Task Follow-Up Setup Action

The follow-up action bar now includes a setup trigger so users can rerun the project-defined setup script without leaving the attempt conversation.

## Action Bar Placement

The setup trigger appears directly to the left of `Send` when the attempt is idle, matching the existing follow-up action layout.

## Icon-Only Control

The action is rendered as a terminal icon without inline text, and exposes `Run setup script` via hover title and aria-label text.

## Setup Trigger Behavior

The control calls a task-attempt route that starts a `SetupScript` execution using the current project `setup_script`, and shows a loading state while the request runs.

## Missing Script Handling

The setup trigger is disabled when the project has no configured `setup_script`, and the server returns a descriptive error if called without one.
