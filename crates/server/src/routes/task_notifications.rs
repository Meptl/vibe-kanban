use axum::{
    Router,
    extract::{
        State,
        ws::{Message, WebSocket, WebSocketUpgrade},
    },
    response::IntoResponse,
    routing::get,
};
use db::models::task_notification::TaskNotification;
use futures_util::{SinkExt, StreamExt, TryStreamExt};
use local_deployment::Deployment;
use serde::Deserialize;
use uuid::Uuid;

use crate::DeploymentImpl;

#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum TaskNotificationsCommand {
    ClearTask { project_id: Uuid, task_id: Uuid },
    ClearAll,
}

pub async fn stream_task_notifications_ws(
    ws: WebSocketUpgrade,
    State(deployment): State<DeploymentImpl>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| async move {
        if let Err(e) = handle_task_notifications_ws(socket, deployment).await {
            tracing::warn!("task notifications WS closed: {}", e);
        }
    })
}

async fn handle_task_notifications_ws(
    socket: WebSocket,
    deployment: DeploymentImpl,
) -> anyhow::Result<()> {
    let mut stream = deployment
        .events()
        .stream_task_notifications_raw()
        .await?
        .map_ok(|msg| msg.to_ws_message_unchecked());

    let (mut sender, mut receiver) = socket.split();

    loop {
        tokio::select! {
            inbound = receiver.next() => {
                match inbound {
                    None => break,
                    Some(Ok(Message::Close(_))) => break,
                    Some(Ok(Message::Text(text))) => {
                        match serde_json::from_str::<TaskNotificationsCommand>(&text) {
                            Ok(TaskNotificationsCommand::ClearTask { project_id, task_id }) => {
                                if let Err(err) = TaskNotification::delete_by_task(&deployment.db().pool, project_id, task_id).await {
                                    tracing::warn!("failed to clear task notifications via ws for project {} task {}: {}", project_id, task_id, err);
                                }
                            }
                            Ok(TaskNotificationsCommand::ClearAll) => {
                                if let Err(err) = TaskNotification::delete_all(&deployment.db().pool).await {
                                    tracing::warn!("failed to clear all notifications via ws: {}", err);
                                }
                            }
                            Err(err) => {
                                tracing::warn!("invalid task notifications ws command: {}", err);
                            }
                        }
                    }
                    Some(Ok(_)) => {}
                    Some(Err(err)) => {
                        tracing::warn!("task notifications ws receive error: {}", err);
                        break;
                    }
                }
            }
            outbound = stream.next() => {
                match outbound {
                    Some(Ok(msg)) => {
                        if sender.send(msg).await.is_err() {
                            break;
                        }
                    }
                    Some(Err(err)) => {
                        tracing::error!("task notifications stream error: {}", err);
                        break;
                    }
                    None => break,
                }
            }
        }
    }

    Ok(())
}

pub fn router() -> Router<DeploymentImpl> {
    Router::new()
        .route(
            "/task-notifications/stream/ws",
            get(stream_task_notifications_ws),
        )
}
