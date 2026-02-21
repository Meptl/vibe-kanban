use db::{
    DBService,
    models::{
        project::Project,
        task::{Task, TaskStatus},
    },
};
use remote::routes::tasks::SharedTaskResponse;
use uuid::Uuid;

use super::ShareError;

#[derive(Clone)]
pub struct SharePublisher {
    db: DBService,
}

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize, ts_rs::TS)]
pub struct SharedTaskDetails {
    pub id: Uuid,
    pub project_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
}

impl SharePublisher {
    pub fn new(db: DBService) -> Self {
        Self { db }
    }

    pub async fn share_task(&self, task_id: Uuid, _user_id: Uuid) -> Result<Uuid, ShareError> {
        let task = Task::find_by_id(&self.db.pool, task_id)
            .await?
            .ok_or(ShareError::TaskNotFound(task_id))?;

        if task.shared_task_id.is_some() {
            return Err(ShareError::AlreadyShared(task.id));
        }

        let project = Project::find_by_id(&self.db.pool, task.project_id)
            .await?
            .ok_or(ShareError::ProjectNotFound(task.project_id))?;
        if project.remote_project_id.is_none() {
            return Err(ShareError::ProjectNotLinked(project.id));
        }

        Err(ShareError::MissingConfig(
            "remote sharing is disabled in local mode",
        ))
    }

    pub async fn update_shared_task(&self, task: &Task) -> Result<(), ShareError> {
        // early exit if task has not been shared
        let Some(_shared_task_id) = task.shared_task_id else {
            return Ok(());
        };

        Ok(())
    }

    pub async fn update_shared_task_by_id(&self, task_id: Uuid) -> Result<(), ShareError> {
        let task = Task::find_by_id(&self.db.pool, task_id)
            .await?
            .ok_or(ShareError::TaskNotFound(task_id))?;

        self.update_shared_task(&task).await
    }

    pub async fn assign_shared_task(
        &self,
        _shared_task_id: Uuid,
        _new_assignee_user_id: Option<String>,
    ) -> Result<SharedTaskResponse, ShareError> {
        Err(ShareError::MissingConfig(
            "remote sharing is disabled in local mode",
        ))
    }

    pub async fn delete_shared_task(&self, shared_task_id: Uuid) -> Result<(), ShareError> {
        if let Some(local_task) =
            Task::find_by_shared_task_id(&self.db.pool, shared_task_id).await?
        {
            Task::set_shared_task_id(&self.db.pool, local_task.id, None).await?;
        }

        Ok(())
    }

    pub async fn link_shared_task(
        &self,
        _shared_task: SharedTaskDetails,
    ) -> Result<Option<Task>, ShareError> {
        Ok(None)
    }

    pub async fn cleanup_shared_tasks(&self) -> Result<(), ShareError> {
        Ok(())
    }
}
