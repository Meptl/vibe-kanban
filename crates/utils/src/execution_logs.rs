use std::path::{Path, PathBuf};

use tokio::io::AsyncWriteExt;
use uuid::Uuid;

use crate::{assets::asset_dir, log_msg::LogMsg};

pub const EXECUTION_LOGS_DIRNAME: &str = "task_attempts";

pub fn process_logs_task_attempt_dir(task_attempt_id: Uuid) -> PathBuf {
    resolve_process_logs_task_attempt_dir(&asset_dir(), task_attempt_id)
}

pub fn process_log_file_path(task_attempt_id: Uuid, process_id: Uuid) -> PathBuf {
    process_log_file_path_in_root(&asset_dir(), task_attempt_id, process_id)
}

pub fn process_log_file_path_in_root(
    root: &Path,
    task_attempt_id: Uuid,
    process_id: Uuid,
) -> PathBuf {
    resolve_process_logs_task_attempt_dir(root, task_attempt_id)
        .join("processes")
        .join(format!("{}.jsonl", process_id))
}

pub async fn cleanup_process_logs_task_attempt_dir(task_attempt_id: Uuid) -> std::io::Result<()> {
    cleanup_process_logs_task_attempt_dir_in_root(&asset_dir(), task_attempt_id).await
}

pub async fn cleanup_process_logs_task_attempt_dir_in_root(
    root: &Path,
    task_attempt_id: Uuid,
) -> std::io::Result<()> {
    let task_attempt_dir = resolve_process_logs_task_attempt_dir(root, task_attempt_id);
    match tokio::fs::remove_dir_all(task_attempt_dir).await {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(e),
    }
}

pub struct ExecutionLogWriter {
    path: PathBuf,
    file: tokio::fs::File,
}

impl ExecutionLogWriter {
    pub async fn new(path: PathBuf) -> std::io::Result<Self> {
        if let Some(parent) = path.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }
        let file = tokio::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&path)
            .await?;
        Ok(Self { path, file })
    }

    pub async fn new_for_execution(
        task_attempt_id: Uuid,
        execution_id: Uuid,
    ) -> std::io::Result<Self> {
        Self::new(process_log_file_path(task_attempt_id, execution_id)).await
    }

    pub fn path(&self) -> &Path {
        &self.path
    }

    pub async fn append_jsonl_line(&mut self, jsonl_line: &str) -> std::io::Result<()> {
        self.file.write_all(jsonl_line.as_bytes()).await
    }
}

pub async fn read_execution_log_file(path: &Path) -> std::io::Result<String> {
    tokio::fs::read_to_string(path).await
}

pub fn parse_log_jsonl_lossy(execution_id: Uuid, jsonl: &str) -> Vec<LogMsg> {
    let mut messages = Vec::new();
    let mut bad_lines = 0usize;

    for line in jsonl.lines() {
        if line.trim().is_empty() {
            continue;
        }

        match serde_json::from_str::<LogMsg>(line) {
            Ok(msg) => messages.push(msg),
            Err(e) => {
                bad_lines += 1;
                if bad_lines <= 3 {
                    tracing::warn!(
                        "Skipping unparsable log line for execution {}: {}",
                        execution_id,
                        e
                    );
                }
            }
        }
    }

    if bad_lines > 3 {
        tracing::warn!(
            "Skipped {} unparsable log lines for execution {}",
            bad_lines,
            execution_id
        );
    }

    messages
}

fn uuid_prefix2(id: Uuid) -> String {
    let s = id.to_string();
    s.chars().take(2).collect()
}

fn resolve_process_logs_task_attempt_dir(root: &Path, task_attempt_id: Uuid) -> PathBuf {
    root.join(EXECUTION_LOGS_DIRNAME)
        .join(uuid_prefix2(task_attempt_id))
        .join(task_attempt_id.to_string())
}
