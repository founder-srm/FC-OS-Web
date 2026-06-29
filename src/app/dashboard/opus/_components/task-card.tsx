"use client";

import { CalendarClock, GitBranch, Link2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { OpusLabel } from "@/database/schemas/opus_labels";
import type { OpusPriority } from "@/database/schemas/opus_priorities";
import {
  formatDueDate,
  initials,
  isOverdue,
  labelTextColor,
  priorityBadgeClass,
} from "@/lib/opus/format";
import { cn } from "@/lib/utils";
import type { BoardTask } from "./types";

export function TaskCard({
  task,
  priorities,
  labels,
  statusName,
  onOpen,
}: {
  task: BoardTask;
  priorities: OpusPriority[];
  labels: OpusLabel[];
  statusName: string;
  onOpen: () => void;
}) {
  const priority = priorities.find((p) => p.id === task.priorityId);
  const taskLabels = labels.filter((l) => task.labelIds.includes(l.id));
  const overdue = isOverdue(task.dueDate, statusName);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-lg border bg-card p-3 text-left shadow-xs transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      {(priority || taskLabels.length > 0) && (
        <div className="flex flex-wrap items-center gap-1">
          {priority && (
            <Badge
              variant="outline"
              className={cn("text-xs", priorityBadgeClass(priority.name))}
            >
              {priority.name}
            </Badge>
          )}
          {taskLabels.map((l) => (
            <span
              key={l.id}
              className="rounded-full px-2 py-px text-xs font-medium"
              style={{
                backgroundColor: l.color,
                color: labelTextColor(l.color),
              }}
            >
              {l.name}
            </span>
          ))}
        </div>
      )}

      <p className="mt-4 text-base font-semibold leading-snug tracking-tight capitalize">
        {task.title}
      </p>

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          {task.dueDate && (
            <span
              className={cn(
                "inline-flex items-center gap-1",
                overdue && "text-destructive",
              )}
            >
              <CalendarClock className="size-3.5" strokeWidth={2.5} />
              {formatDueDate(task.dueDate)}
            </span>
          )}
          {task.subtaskCount > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <GitBranch className="size-3.5" strokeWidth={2.5} />
              {task.subtaskCount}
            </span>
          )}
          {task.linkCount > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <Link2 className="size-3.5" strokeWidth={2.5} />
              {task.linkCount}
            </span>
          )}
        </div>

        {task.assignees.length > 0 && (
          <div className="flex items-center -space-x-1.5">
            {task.assignees.slice(0, 3).map((a) => (
              <Avatar key={a.id} className="size-5 border border-background">
                <AvatarFallback className="text-[9px]">
                  {initials(a.firstName, a.lastName)}
                </AvatarFallback>
              </Avatar>
            ))}
            {task.assignees.length > 3 && (
              <span className="pl-2 text-[10px] text-muted-foreground">
                +{task.assignees.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
