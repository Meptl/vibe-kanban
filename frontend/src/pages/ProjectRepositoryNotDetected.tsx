import { AlertTriangle, ArrowLeft, RefreshCw, Settings } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProject } from '@/contexts/ProjectContext';
import { paths } from '@/lib/paths';

export function ProjectRepositoryNotDetected() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { project } = useProject();

  if (!projectId) {
    return <Navigate to={paths.projects()} replace />;
  }

  return (
    <div className="h-full w-full flex items-center justify-center p-6">
      <Card className="w-full max-w-xl">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle>Underlying repository not detected</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            We could not find the repository for this project. This usually
            happens when the folder was moved or deleted.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Update the repository path in Project Settings, then return to this
            project.
          </p>
          {project?.git_repo_path ? (
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Current path</p>
              <p className="text-sm break-all">{project.git_repo_path}</p>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() =>
                navigate(`/settings/projects?projectId=${projectId}`, {
                  state: {
                    settingsFrom: `/projects/${projectId}/repository-not-detected`,
                  },
                })
              }
            >
              <Settings className="mr-2 h-4 w-4" />
              Open Project Settings
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(paths.projectTasks(projectId))}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button variant="ghost" onClick={() => navigate(paths.projects())}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
