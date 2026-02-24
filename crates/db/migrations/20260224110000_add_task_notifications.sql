CREATE TABLE task_notifications (
    id          TEXT PRIMARY KEY,
    project_id  TEXT NOT NULL,
    task_id     TEXT NOT NULL,
    task_title  TEXT NOT NULL,
    outcome     TEXT NOT NULL CHECK (outcome IN ('merged', 'failed', 'completed')),
    created_at  TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);

CREATE INDEX idx_task_notifications_project_id_created_at
    ON task_notifications(project_id, created_at DESC);

CREATE INDEX idx_task_notifications_task_lookup
    ON task_notifications(project_id, task_id);
