CREATE TABLE IF NOT EXISTS drafts (
    task_attempt_id TEXT NOT NULL,
    draft_type TEXT NOT NULL CHECK(draft_type IN ('follow_up')),
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    PRIMARY KEY (task_attempt_id, draft_type)
);

CREATE INDEX IF NOT EXISTS idx_drafts_task_attempt_id
    ON drafts(task_attempt_id);
