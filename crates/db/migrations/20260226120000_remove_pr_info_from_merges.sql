DROP INDEX IF EXISTS idx_merges_open_pr;
DROP INDEX IF EXISTS idx_merges_type_status;

CREATE TABLE merges_new (
    id BLOB PRIMARY KEY,
    task_attempt_id BLOB NOT NULL,
    merge_commit TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    target_branch_name TEXT NOT NULL,
    FOREIGN KEY (task_attempt_id) REFERENCES task_attempts(id) ON DELETE CASCADE
);

INSERT INTO merges_new (
    id,
    task_attempt_id,
    merge_commit,
    created_at,
    target_branch_name
)
SELECT
    id,
    task_attempt_id,
    COALESCE(merge_commit, pr_merge_commit_sha) AS merge_commit,
    created_at,
    target_branch_name
FROM merges
WHERE COALESCE(merge_commit, pr_merge_commit_sha) IS NOT NULL;

DROP TABLE merges;
ALTER TABLE merges_new RENAME TO merges;

CREATE INDEX idx_merges_task_attempt_id ON merges(task_attempt_id);
