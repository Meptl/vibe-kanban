use std::{path::Path, sync::Arc};

use async_trait::async_trait;
use command_group::AsyncCommandGroup;
use serde::{Deserialize, Serialize};
use tokio::process::Command;
use ts_rs::TS;
use workspace_utils::{path::get_viboard_temp_dir, shell::get_shell_command};

use crate::{
    actions::Executable,
    approvals::ExecutorApprovalService,
    env::ExecutionEnv,
    executors::{ExecutorError, SpawnedChild},
};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, TS)]
pub enum ScriptRequestLanguage {
    Bash,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, TS)]
pub enum ScriptContext {
    SetupScript,
    CleanupScript,
    DevServer,
    ToolInstallScript,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, TS)]
pub struct ScriptRequest {
    pub script: String,
    pub language: ScriptRequestLanguage,
    pub context: ScriptContext,
}

#[async_trait]
impl Executable for ScriptRequest {
    async fn spawn(
        &self,
        current_dir: &Path,
        _approvals: Arc<dyn ExecutorApprovalService>,
        env: &ExecutionEnv,
    ) -> Result<SpawnedChild, ExecutorError> {
        let script_to_run = if matches!(self.context, ScriptContext::SetupScript) {
            if let Some(attempt_id) = env.get("VK_ATTEMPT_ID") {
                let setup_env_dir = get_viboard_temp_dir().join("setup-env");
                let setup_env_before = setup_env_dir.join(format!("{attempt_id}.before"));
                let setup_env_after = setup_env_dir.join(format!("{attempt_id}.after"));
                let setup_env_diff = setup_env_dir.join(format!("{attempt_id}.diff"));

                format!(
                    "mkdir -p \"{setup_env_dir}\"\nenv > \"{setup_env_before}\"\n{script}\n__vk_setup_status=$?\nenv > \"{setup_env_after}\"\nawk -F= 'NR==FNR {{ before[$1]=$0; next }} !($1 in before) || before[$1] != $0 {{ print $0 }}' \"{setup_env_before}\" \"{setup_env_after}\" > \"{setup_env_diff}\"\nrm -f \"{setup_env_before}\" \"{setup_env_after}\"\nexit $__vk_setup_status",
                    setup_env_dir = setup_env_dir.to_string_lossy(),
                    setup_env_before = setup_env_before.to_string_lossy(),
                    setup_env_after = setup_env_after.to_string_lossy(),
                    setup_env_diff = setup_env_diff.to_string_lossy(),
                    script = self.script
                )
            } else {
                self.script.clone()
            }
        } else {
            self.script.clone()
        };

        let (shell_cmd, shell_arg) = get_shell_command();
        let mut command = Command::new(shell_cmd);
        command
            .kill_on_drop(true)
            .stdin(std::process::Stdio::null())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .arg(shell_arg)
            .arg(script_to_run)
            .current_dir(current_dir);

        // Apply environment variables
        env.apply_to_command(&mut command);

        let child = command.group_spawn()?;

        Ok(child.into())
    }
}
