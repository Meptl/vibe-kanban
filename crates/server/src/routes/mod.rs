use axum::{
    Router,
    routing::{IntoMakeService, get},
};
use rmcp::transport::{
    StreamableHttpServerConfig, StreamableHttpService,
    streamable_http_server::session::local::LocalSessionManager,
};

use crate::{DeploymentImpl, mcp::task_server::TaskServer};

pub mod approvals;
pub mod config;
pub mod containers;
pub mod filesystem;
// pub mod github;
pub mod events;
pub mod execution_processes;
pub mod frontend;
pub mod health;
pub mod images;
pub mod projects;
pub mod tags;
pub mod task_attempts;
pub mod task_notifications;
pub mod tasks;

pub async fn router(deployment: DeploymentImpl, mcp_base_url: &str) -> IntoMakeService<Router> {
    let task_service = TaskServer::new(mcp_base_url).init().await;
    let mcp_service = StreamableHttpService::<TaskServer, LocalSessionManager>::new(
        move || Ok(task_service.clone()),
        Default::default(),
        StreamableHttpServerConfig::default(),
    );

    // Create routers with different middleware layers
    let base_routes = Router::new()
        .route("/health", get(health::health_check))
        .merge(config::router())
        .merge(containers::router(&deployment))
        .merge(projects::router(&deployment))
        .merge(tasks::router(&deployment))
        .merge(task_attempts::router(&deployment))
        .merge(task_notifications::router())
        .merge(execution_processes::router(&deployment))
        .merge(tags::router(&deployment))
        .merge(filesystem::router())
        .merge(events::router(&deployment))
        .merge(approvals::router())
        .nest("/images", images::routes())
        .with_state(deployment);

    Router::new()
        .route("/", get(frontend::serve_frontend_root))
        .route("/{*path}", get(frontend::serve_frontend))
        .nest_service("/mcp", mcp_service)
        .nest("/api", base_routes)
        .into_make_service()
}
