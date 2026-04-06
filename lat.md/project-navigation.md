# Project View Escape Shortcut

Pressing Escape in the project task board closes an open task panel first, then returns to the all-projects page when no panel is open.

This behavior is implemented in [[frontend/src/pages/ProjectTasks.tsx#ProjectTasks]] through the KANBAN `EXIT` shortcut, and aligns with the shortcut intent documented in [[frontend/src/keyboard/registry.ts#keyBindings]].

# Task Panel First-Open Behavior

Opening a task attempt panel immediately shows the working task UI (diffs, preview, and actions) without an extra gating step.

This behavior is enforced in [[frontend/src/pages/ProjectTasks.tsx#ProjectTasks]], where task panel routing and panel state are handled directly with no first-open modal branch.
