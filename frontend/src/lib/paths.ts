export const paths = {
  projects: () => '/projects',
  projectTasks: (projectId: string) => `/projects/${projectId}/tasks`,
  projectRepositoryNotDetected: (projectId: string) =>
    `/projects/${projectId}/repository-not-detected`,
  task: (projectId: string, taskId: string) =>
    `/projects/${projectId}/tasks/${taskId}`,
  attempt: (projectId: string, taskId: string, attemptId: string) =>
    `/projects/${projectId}/tasks/${taskId}/attempts/${attemptId}`,
};
