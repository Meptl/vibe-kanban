import type { TaskOrigin } from 'shared/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const originConfig: Record<TaskOrigin, { label: string; className: string }> = {
  human: {
    label: 'Human',
    className:
      'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
  },
  agent: {
    label: 'Agent',
    className:
      'border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
  },
};

interface TaskOriginBadgeProps {
  origin: TaskOrigin;
  className?: string;
}

export function TaskOriginBadge({ origin, className }: TaskOriginBadgeProps) {
  const config = originConfig[origin];

  return (
    <Badge
      variant="outline"
      className={cn(
        'h-5 px-1.5 py-0 text-[10px] font-medium leading-none uppercase tracking-normal',
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
