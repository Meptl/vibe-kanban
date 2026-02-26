import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import type { TaskWithAttemptStatus, TaskAttempt } from 'shared/types';
import { useOpenInEditor } from '@/hooks/useOpenInEditor';
import { DeleteTaskConfirmationDialog } from '@/components/dialogs/tasks/DeleteTaskConfirmationDialog';
import { ViewProcessesDialog } from '@/components/dialogs/tasks/ViewProcessesDialog';
import { CreateAttemptDialog } from '@/components/dialogs/tasks/CreateAttemptDialog';
import { GitActionsDialog } from '@/components/dialogs/tasks/GitActionsDialog';
import { useProject } from '@/contexts/ProjectContext';
import { openTaskForm } from '@/lib/openTaskForm';
import { cn } from '@/lib/utils';

interface ActionsDropdownProps {
  task?: TaskWithAttemptStatus | null;
  attempt?: TaskAttempt | null;
  triggerClassName?: string;
}

export function ActionsDropdown({
  task,
  attempt,
  triggerClassName,
}: ActionsDropdownProps) {
  const { t } = useTranslation('tasks');
  const { projectId } = useProject();
  const openInEditor = useOpenInEditor(attempt?.id);

  const hasAttemptActions = Boolean(attempt);
  const hasTaskActions = Boolean(task);
  const stopEventPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!projectId || !task) return;
    openTaskForm({ mode: 'edit', projectId, task });
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!projectId || !task) return;
    openTaskForm({ mode: 'duplicate', projectId, initialTask: task });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!projectId || !task) return;
    try {
      await DeleteTaskConfirmationDialog.show({
        task,
        projectId,
      });
    } catch {
      // User cancelled or error occurred
    }
  };

  const handleOpenInEditor = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!attempt?.id) return;
    openInEditor();
  };

  const handleViewProcesses = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!attempt?.id) return;
    ViewProcessesDialog.show({ attemptId: attempt.id });
  };

  const handleCreateNewAttempt = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task?.id) return;
    CreateAttemptDialog.show({
      taskId: task.id,
    });
  };

  const handleGitActions = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!attempt?.id) return;
    GitActionsDialog.show({
      attemptId: attempt.id,
      projectId,
    });
  };
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="icon"
            aria-label="Actions"
            className={cn(triggerClassName)}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {hasAttemptActions && (
            <>
              <DropdownMenuLabel
                onPointerDown={stopEventPropagation}
                onMouseDown={stopEventPropagation}
                onClick={stopEventPropagation}
              >
                {t('actionsMenu.attempt')}
              </DropdownMenuLabel>
              <DropdownMenuItem
                disabled={!attempt?.id}
                onClick={handleOpenInEditor}
              >
                {t('actionsMenu.openInIde')}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!attempt?.id}
                onClick={handleViewProcesses}
              >
                {t('actionsMenu.viewProcesses')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCreateNewAttempt}>
                {t('actionsMenu.createNewAttempt')}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!attempt?.id}
                onClick={handleGitActions}
              >
                {t('actionsMenu.gitActions')}
              </DropdownMenuItem>
              {hasTaskActions && (
                <DropdownMenuSeparator
                  onPointerDown={stopEventPropagation}
                  onMouseDown={stopEventPropagation}
                  onClick={stopEventPropagation}
                />
              )}
            </>
          )}

          {hasTaskActions && (
            <>
              <DropdownMenuLabel
                onPointerDown={stopEventPropagation}
                onMouseDown={stopEventPropagation}
                onClick={stopEventPropagation}
              >
                {t('actionsMenu.task')}
              </DropdownMenuLabel>
              <DropdownMenuItem disabled={!projectId} onClick={handleEdit}>
                {t('common:buttons.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!projectId} onClick={handleDuplicate}>
                {t('actionsMenu.duplicate')}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!projectId}
                onClick={handleDelete}
                className="text-destructive"
              >
                {t('common:buttons.delete')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
