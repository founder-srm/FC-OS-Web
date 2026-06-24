"use client";

import {
  CalendarClock,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatDueDate,
  initials,
  isOverdue,
  labelTextColor,
  priorityBadgeClass,
} from "@/lib/opus/format";
import { cn } from "@/lib/utils";
import type { TaskDetail, TaskFull } from "@/utils/opusDbActions";
import {
  addSubtaskAction,
  deleteTaskAction,
  loadTaskDetailAction,
  type TaskInputDTO,
  updateTaskAction,
} from "../actions";
import { StatusIcon } from "./status-icon";
import { TaskFieldsDialog } from "./task-fields-dialog";
import type { DomainMeta, FormValues } from "./types";

function toValues(task: TaskFull): FormValues {
  return {
    title: task.title,
    description: task.description ?? "",
    statusId: task.statusId,
    priorityId: task.priorityId ?? "",
    dueDate: task.dueDate,
    assigneeIds: task.assignees.map((a) => a.id),
    labelIds: task.labelIds,
    links: task.links.map((l) => ({ url: l.url, label: l.label ?? "" })),
  };
}

export function TaskDetailDialog({
  taskId,
  meta,
  currentUserId,
  canManage,
  onClose,
  onChanged,
}: {
  taskId: string | null;
  meta: DomainMeta;
  currentUserId: string;
  canManage: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [subtaskOpen, setSubtaskOpen] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<TaskFull | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const load = useCallback((id: string) => {
    setLoading(true);
    loadTaskDetailAction(id)
      .then((d) => setDetail(d))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (taskId) load(taskId);
    else setDetail(null);
  }, [taskId, load]);

  const statusMeta = (id: string) => {
    const idx = meta.statuses.findIndex((s) => s.id === id);
    const s = meta.statuses[idx];
    return s
      ? { color: s.color, fraction: (idx + 1) / meta.statuses.length, name: s.name }
      : null;
  };
  const statusName =
    meta.statuses.find((s) => s.id === detail?.statusId)?.name ?? "";
  const priority = meta.priorities.find((p) => p.id === detail?.priorityId);
  const taskLabels = meta.labels.filter((l) => detail?.labelIds.includes(l.id));
  const canEdit =
    canManage ||
    (detail?.assignees.some((a) => a.id === currentUserId) ?? false);
  const overdue = isOverdue(detail?.dueDate ?? null, statusName);

  function refresh() {
    if (taskId) load(taskId);
    onChanged();
  }

  function removeTask(id: string, isSubtask: boolean) {
    startDelete(async () => {
      const res = await deleteTaskAction(id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(isSubtask ? "Subtask deleted." : "Task deleted.");
      if (isSubtask) refresh();
      else {
        onChanged();
        onClose();
      }
    });
  }

  return (
    <>
      <Dialog
        open={taskId !== null && !editOpen && !subtaskOpen}
        onOpenChange={(o) => !o && onClose()}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          {loading || !detail ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="gap-1.5">
                    {(() => {
                      const sm = statusMeta(detail.statusId);
                      return sm ? (
                        <StatusIcon color={sm.color} fraction={sm.fraction} />
                      ) : null;
                    })()}
                    {statusName}
                  </Badge>
                  {priority && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        priorityBadgeClass(priority.name),
                      )}
                    >
                      {priority.name}
                    </Badge>
                  )}
                  {detail.dueDate && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs",
                        overdue ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      <CalendarClock className="size-3.5" />
                      {formatDueDate(detail.dueDate)}
                    </span>
                  )}
                </div>
                <DialogTitle className="pt-1 text-xl">
                  {detail.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                {detail.description && (
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {detail.description}
                  </p>
                )}

                {taskLabels.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {taskLabels.map((l) => (
                      <span
                        key={l.id}
                        className="rounded px-1.5 py-0.5 text-xs font-medium"
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

                {detail.assignees.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                      Assignees
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {detail.assignees.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center gap-1.5 rounded-full border py-0.5 pr-2.5 pl-0.5 text-sm"
                        >
                          <Avatar className="size-5">
                            <AvatarFallback className="text-[9px]">
                              {initials(a.firstName, a.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          {a.firstName} {a.lastName}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detail.links.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                      References
                    </p>
                    <div className="space-y-1">
                      {detail.links.map((l) => (
                        <a
                          key={l.id}
                          href={l.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="size-3.5 shrink-0" />
                          <span className="truncate">{l.label ?? l.url}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Subtasks
                      {detail.subtasks.length > 0 &&
                        ` (${detail.subtasks.length})`}
                    </p>
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingSubtask(null);
                          setSubtaskOpen(true);
                        }}
                      >
                        <Plus className="size-4" /> Add
                      </Button>
                    )}
                  </div>
                  {detail.subtasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No subtasks.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {detail.subtasks.map((st) => {
                        const sm = statusMeta(st.statusId);
                        return (
                          <div
                            key={st.id}
                            className="flex items-center gap-2 rounded-md border px-2.5 py-1.5"
                          >
                            <Badge
                              variant="secondary"
                              className="shrink-0 gap-1 text-[10px]"
                            >
                              {sm && (
                                <StatusIcon
                                  color={sm.color}
                                  fraction={sm.fraction}
                                  size={12}
                                />
                              )}
                              {sm?.name}
                            </Badge>
                            <span className="flex-1 truncate text-sm">
                              {st.title}
                            </span>
                            {st.assignees.slice(0, 2).map((a) => (
                              <Avatar key={a.id} className="size-5">
                                <AvatarFallback className="text-[9px]">
                                  {initials(a.firstName, a.lastName)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground"
                                onClick={() => {
                                  setEditingSubtask(st);
                                  setSubtaskOpen(true);
                                }}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                            )}
                            {canManage && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground"
                                disabled={isDeleting}
                                onClick={() => removeTask(st.id, true)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {(canEdit || canManage) && (
                <div className="flex justify-between gap-2 border-t pt-4">
                  {canManage ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={isDeleting}
                      onClick={() => removeTask(detail.id, false)}
                    >
                      {isDeleting && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      Delete task
                    </Button>
                  ) : (
                    <span />
                  )}
                  {canEdit && (
                    <Button size="sm" onClick={() => setEditOpen(true)}>
                      <Pencil className="size-4" /> Edit
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit the top-level task */}
      {detail && editOpen && (
        <TaskFieldsDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          heading="Edit task"
          submitLabel="Save changes"
          meta={meta}
          showDueDate
          showSubtasks={false}
          initial={toValues(detail)}
          onSubmit={async (input: TaskInputDTO) => {
            const res = await updateTaskAction(detail.id, input);
            if ("ok" in res) {
              toast.success("Task updated.");
              refresh();
            }
            return res;
          }}
        />
      )}

      {/* Add or edit a subtask */}
      {detail && subtaskOpen && (
        <TaskFieldsDialog
          open={subtaskOpen}
          onOpenChange={setSubtaskOpen}
          heading={editingSubtask ? "Edit subtask" : "New subtask"}
          description="Subtasks inherit the parent task's due date."
          submitLabel={editingSubtask ? "Save" : "Add subtask"}
          meta={meta}
          showDueDate={false}
          showSubtasks={false}
          initial={editingSubtask ? toValues(editingSubtask) : undefined}
          onSubmit={async (input: TaskInputDTO) => {
            const res = editingSubtask
              ? await updateTaskAction(editingSubtask.id, input)
              : await addSubtaskAction(detail.id, input);
            if ("ok" in res) {
              toast.success(
                editingSubtask ? "Subtask updated." : "Subtask added.",
              );
              refresh();
            }
            return res;
          }}
        />
      )}
    </>
  );
}
