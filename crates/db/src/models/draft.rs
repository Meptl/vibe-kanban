use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use ts_rs::TS;
use uuid::Uuid;

/// Data for a persisted review comment inside a follow-up draft.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
pub struct DraftReviewCommentData {
    pub file_path: String,
    pub line_number: i32,
    pub side: String,
    pub text: String,
    #[serde(default)]
    pub code_line: Option<String>,
}

/// Data for a follow-up draft.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
pub struct DraftFollowUpData {
    pub message: String,
    #[serde(default)]
    pub variant: Option<String>,
    #[serde(default)]
    pub review_comments: Vec<DraftReviewCommentData>,
    #[serde(default)]
    pub review_comment_drafts: Vec<DraftReviewCommentData>,
}

impl DraftFollowUpData {
    pub fn is_empty(&self) -> bool {
        self.message.trim().is_empty()
            && self.variant.is_none()
            && self.review_comments.is_empty()
            && self.review_comment_drafts.is_empty()
    }
}

pub struct DraftStore;

impl DraftStore {
    pub async fn get_follow_up(
        pool: &SqlitePool,
        task_attempt_id: Uuid,
    ) -> Result<Option<DraftFollowUpData>, sqlx::Error> {
        let row = sqlx::query_as::<_, (String,)>(
            r#"
            SELECT payload
            FROM drafts
            WHERE task_attempt_id = ? AND draft_type = 'follow_up'
            "#,
        )
        .bind(task_attempt_id)
        .fetch_optional(pool)
        .await?;

        let Some((payload,)) = row else {
            return Ok(None);
        };

        let parsed = serde_json::from_str::<DraftFollowUpData>(&payload).map_err(|e| {
            sqlx::Error::Protocol(format!(
                "failed to deserialize follow-up draft payload: {e}"
            ))
        })?;
        Ok(Some(parsed))
    }

    pub async fn upsert_follow_up(
        pool: &SqlitePool,
        task_attempt_id: Uuid,
        data: &DraftFollowUpData,
    ) -> Result<(), sqlx::Error> {
        let payload = serde_json::to_string(data).map_err(|e| {
            sqlx::Error::Protocol(format!("failed to serialize follow-up draft: {e}"))
        })?;

        sqlx::query(
            r#"
            INSERT INTO drafts (task_attempt_id, draft_type, payload)
            VALUES (?, 'follow_up', ?)
            ON CONFLICT(task_attempt_id, draft_type) DO UPDATE SET
                payload = excluded.payload,
                updated_at = datetime('now', 'subsec')
            "#,
        )
        .bind(task_attempt_id)
        .bind(payload)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn delete_follow_up(
        pool: &SqlitePool,
        task_attempt_id: Uuid,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            DELETE FROM drafts
            WHERE task_attempt_id = ? AND draft_type = 'follow_up'
            "#,
        )
        .bind(task_attempt_id)
        .execute(pool)
        .await?;
        Ok(())
    }
}
