import { Fragment, memo } from 'react';
import { Trash2 } from 'lucide-react';
import {
  type DragCancelEvent,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  KanbanBoard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from '@/components/ui/shadcn-io/kanban';
import { TaskCard } from './TaskCard';
import type { TaskStatus, TaskWithAttemptStatus } from 'shared/types';
import { statusBoardColors, statusLabels } from '@/utils/statusLabels';

export type KanbanColumnItem = {
  type: 'task';
  task: TaskWithAttemptStatus;
};

export type KanbanColumns = Record<TaskStatus, KanbanColumnItem[]>;

interface TaskKanbanBoardProps {
  columns: KanbanColumns;
  onDragEnd: (event: DragEndEvent) => void;
  onDragStart?: (event: DragStartEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  onDragCancel?: (event: DragCancelEvent) => void;
  onViewTaskDetails: (task: TaskWithAttemptStatus) => void;
  selectedTaskId?: string;
  onCreateTask?: () => void;
  projectId: string;
  dropPreview?: {
    status: TaskStatus;
    index: number;
    height?: number | null;
  } | null;
}

function TaskKanbanBoard({
  columns,
  onDragEnd,
  onDragStart,
  onDragOver,
  onDragCancel,
  onViewTaskDetails,
  selectedTaskId,
  onCreateTask,
  projectId,
  dropPreview,
}: TaskKanbanBoardProps) {
  const renderDropPlaceholder = (statusKey: TaskStatus, index: number) => {
    if (
      !dropPreview ||
      dropPreview.status !== statusKey ||
      dropPreview.index !== index
    ) {
      return null;
    }

    return (
      <div
        aria-hidden="true"
        className="border-b"
        key={`drop-preview-${statusKey}-${index}`}
        style={{
          height: dropPreview.height ?? 64,
          backgroundColor: 'hsl(var(--muted-foreground) / 0.28)',
        }}
      />
    );
  };

  return (
    <KanbanProvider
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragCancel={onDragCancel}
    >
      {Object.entries(columns).map(([status, items]) => {
        const statusKey = status as TaskStatus;
        return (
          <KanbanBoard key={status} id={statusKey}>
            <KanbanHeader
              name={
                statusKey === 'cancelled' ? (
                  <span className="flex items-center gap-1.5">
                    <span>(1 hour)</span>
                  </span>
                ) : (
                  statusLabels[statusKey]
                )
              }
              color={statusBoardColors[statusKey]}
              onAddTask={statusKey === 'todo' ? onCreateTask : undefined}
              leadingIcon={
                statusKey === 'cancelled' ? (
                  <Trash2
                    className="h-3.5 w-3.5 text-destructive"
                    aria-hidden="true"
                  />
                ) : undefined
              }
              hideAddTask={statusKey !== 'todo'}
            />
            <KanbanCards>
              {renderDropPlaceholder(statusKey, 0)}
              {items.map((item, index) => {
                return (
                  <Fragment key={item.task.id}>
                    <TaskCard
                      task={item.task}
                      index={index}
                      status={statusKey}
                      onViewDetails={onViewTaskDetails}
                      isOpen={selectedTaskId === item.task.id}
                      projectId={projectId}
                    />
                    {renderDropPlaceholder(statusKey, index + 1)}
                  </Fragment>
                );
              })}
            </KanbanCards>
          </KanbanBoard>
        );
      })}
    </KanbanProvider>
  );
}

export default memo(TaskKanbanBoard);
