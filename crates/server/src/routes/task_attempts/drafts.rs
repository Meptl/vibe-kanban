use axum::{
    Extension, Json, Router, extract::State, middleware::from_fn_with_state,
    response::Json as ResponseJson, routing::get,
};
use db::models::{draft::DraftStore, task_attempt::TaskAttempt};
use local_deployment::Deployment;
use utils::response::ApiResponse;

use crate::{DeploymentImpl, error::ApiError, middleware::load_task_attempt_middleware};

pub async fn get_draft(
    Extension(task_attempt): Extension<TaskAttempt>,
    State(deployment): State<DeploymentImpl>,
) -> Result<ResponseJson<ApiResponse<Option<db::models::draft::DraftFollowUpData>>>, ApiError> {
    let draft = DraftStore::get_follow_up(&deployment.db().pool, task_attempt.id).await?;
    Ok(ResponseJson(ApiResponse::success(draft)))
}

pub async fn upsert_draft(
    Extension(task_attempt): Extension<TaskAttempt>,
    State(deployment): State<DeploymentImpl>,
    Json(payload): Json<db::models::draft::DraftFollowUpData>,
) -> Result<ResponseJson<ApiResponse<()>>, ApiError> {
    if payload.is_empty() {
        DraftStore::delete_follow_up(&deployment.db().pool, task_attempt.id).await?;
    } else {
        DraftStore::upsert_follow_up(&deployment.db().pool, task_attempt.id, &payload).await?;
    }
    Ok(ResponseJson(ApiResponse::success(())))
}

pub async fn delete_draft(
    Extension(task_attempt): Extension<TaskAttempt>,
    State(deployment): State<DeploymentImpl>,
) -> Result<ResponseJson<ApiResponse<()>>, ApiError> {
    DraftStore::delete_follow_up(&deployment.db().pool, task_attempt.id).await?;
    Ok(ResponseJson(ApiResponse::success(())))
}

pub fn router(deployment: &DeploymentImpl) -> Router<DeploymentImpl> {
    Router::new()
        .route("/", get(get_draft).put(upsert_draft).delete(delete_draft))
        .layer(from_fn_with_state(
            deployment.clone(),
            load_task_attempt_middleware,
        ))
}
