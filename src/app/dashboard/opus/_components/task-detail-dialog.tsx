"use client";

import {
  CalendarClock,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatDueDate,
  initials,
  isOverdue,
  labelTextColor,
  priorityBadgeClass,
  statusFraction,
} from "@/lib/opus/format";
import { cn } from "@/lib/utils";
import type { TaskDetail, TaskFull } from "@/utils/opusDbActions";
import {
  addSubtaskAction,
  deleteTaskAction,
  loadTaskDetailAction,
  setTaskStatusAction,
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

function statusMetaFor(meta: DomainMeta, id: string) {
  const s = meta.statuses.find((s) => s.id === id);
  if (!s) return null;
  return {
    color: s.color,
    fraction: statusFraction(meta.statuses, id),
    name: s.name,
  };
}

/** Static status pill — shown to viewers who can't change the status. */
function StatusBadge({
  meta,
  statusId,
  compact,
}: {
  meta: DomainMeta;
  statusId: string;
  compact?: boolean;
}) {
  const sm = statusMetaFor(meta, statusId);
  return (
    <Badge
      variant="secondary"
      className={cn(
        "shrink-0 font-medium",
        compact ? "gap-1 text-[10px]" : "gap-1.5 text-xs",
      )}
    >
      {sm && (
        <StatusIcon
          color={sm.color}
          fraction={sm.fraction}
          size={compact ? 12 : undefined}
        />
      )}
      {sm?.name}
    </Badge>
  );
}

/** Status dropdown — the one mutation assigned members may perform. */
function StatusSelect({
  meta,
  statusId,
  disabled,
  onChange,
}: {
  meta: DomainMeta;
  statusId: string;
  disabled?: boolean;
  onChange: (statusId: string) => void;
}) {
  return (
    <Select value={statusId} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger size="sm" className="w-auto shrink-0 gap-1.5 font-medium">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {meta.statuses.map((s) => (
          <SelectItem key={s.id} value={s.id} className="font-medium">
            <StatusIcon
              color={s.color}
              fraction={statusFraction(meta.statuses, s.id)}
            />
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Header badges (status / priority / due) + body (description, labels, assignees,
 * links) for a single task — shared by the task detail dialog and the subtask
 * drill-in dialog. */
function TaskHeaderAndBody({
  task,
  meta,
  canSetStatus,
  statusPending,
  onStatusChange,
}: {
  task: TaskFull;
  meta: DomainMeta;
  canSetStatus: boolean;
  statusPending: boolean;
  onStatusChange: (statusId: string) => void;
}) {
  const sm = statusMetaFor(meta, task.statusId);
  const statusName = sm?.name ?? "";
  const priority = meta.priorities.find((p) => p.id === task.priorityId);
  const taskLabels = meta.labels.filter((l) => task.labelIds.includes(l.id));
  const overdue = isOverdue(task.dueDate, statusName);

  return (
    <>
      <DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          {canSetStatus ? (
            <StatusSelect
              meta={meta}
              statusId={task.statusId}
              disabled={statusPending}
              onChange={onStatusChange}
            />
          ) : (
            <StatusBadge meta={meta} statusId={task.statusId} />
          )}
          {priority && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-medium",
                priorityBadgeClass(priority.name),
              )}
            >
              {priority.name}
            </Badge>
          )}
          {task.dueDate && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold",
                overdue ? "text-destructive" : "text-muted-foreground",
              )}
            >
              <CalendarClock className="size-3.5" strokeWidth={2.5} />
              {formatDueDate(task.dueDate)}
            </span>
          )}
        </div>
        <DialogTitle className="pt-4 text-4xl font-serif font-medium">
          {task.title}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        {task.description && (
          <p className="whitespace-pre-wrap text-base text-muted-foreground">
            {task.description}
          </p>
        )}

        {taskLabels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {taskLabels.map((l) => (
              <span
                key={l.id}
                className="rounded-full px-2 py-0.5 text-xs font-medium"
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

        {task.assignees.length > 0 && (
          <div>
            <div className="flex flex-wrap gap-2 font-medium">
              {task.assignees.map((a) => (
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

        {task.links.length > 0 && (
          <div className=" flex items-center gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              References:
            </p>
            <div className="flex items-center gap-1 flex-wrap">
              {task.links.map((l) => (
                <Link key={l.id} href={l.url} target="_blank" rel="noreferrer">
                  <Badge variant={"link"}>
                    <ExternalLink strokeWidth={2.5} />
                    <span className="truncate font-medium">
                      {l.label ?? l.url}
                    </span>
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
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
  const [viewingSubtaskId, setViewingSubtaskId] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const [statusPending, startStatus] = useTransition();

  const load = useCallback((id: string) => {
    setLoading(true);
    loadTaskDetailAction(id)
      .then((d) => setDetail(d))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (taskId) load(taskId);
    else setDetail(null);
    // A new (or cleared) task can't keep a stale subtask drilled in.
    setViewingSubtaskId(null);
  }, [taskId, load]);

  const canSetStatus = (assignees: { id: string }[]) =>
    canManage || assignees.some((a) => a.id === currentUserId);
  const viewingSubtask =
    detail?.subtasks.find((s) => s.id === viewingSubtaskId) ?? null;

  function refresh() {
    if (taskId) load(taskId);
    onChanged();
  }

  function changeStatus(id: string, statusId: string) {
    startStatus(async () => {
      const res = await setTaskStatusAction(id, statusId);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      refresh();
    });
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
        open={taskId !== null && !editOpen && !subtaskOpen && !viewingSubtaskId}
        onOpenChange={(o) => !o && onClose()}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl p-6">
          {loading || !detail ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            <>
              <TaskHeaderAndBody
                task={detail}
                meta={meta}
                canSetStatus={canSetStatus(detail.assignees)}
                statusPending={statusPending}
                onStatusChange={(s) => changeStatus(detail.id, s)}
              />

              <div className="space-y-6">
                <Separator />

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Subtasks
                      {detail.subtasks.length > 0 &&
                        ` (${detail.subtasks.length})`}
                    </p>
                    {canManage && (
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
                      {detail.subtasks.map((st) => (
                        <div
                          key={st.id}
                          className="flex items-center gap-2 rounded-md border px-1 py-1 truncate transition-colors hover:border-primary/40 hover:bg-accent/40"
                        >
                          {canSetStatus(st.assignees) ? (
                            <StatusSelect
                              meta={meta}
                              statusId={st.statusId}
                              disabled={statusPending}
                              onChange={(s) => changeStatus(st.id, s)}
                            />
                          ) : (
                            <StatusBadge
                              meta={meta}
                              statusId={st.statusId}
                              compact
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => setViewingSubtaskId(st.id)}
                            className="flex flex-1 cursor-pointer items-center gap-2 justify-between overflow-hidden text-left"
                          >
                            <span className="flex-1 truncate text-sm max-w-70 sm:max-w-lg">
                              {st.title}
                            </span>
                            <div className="flex items-center -space-x-1.5">
                              {st.assignees.slice(0, 2).map((a) => (
                                <Avatar key={a.id} className="size-5">
                                  <AvatarFallback className="text-[9px]">
                                    {initials(a.firstName, a.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                          </button>
                          {canManage && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  setEditingSubtask(st);
                                  setSubtaskOpen(true);
                                }}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                disabled={isDeleting}
                                onClick={() => removeTask(st.id, true)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {canManage && (
                <div className="flex justify-between gap-2 border-t pt-4">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={isDeleting}
                    onClick={() => removeTask(detail.id, false)}
                  >
                    {isDeleting && <Loader2 className="size-4 animate-spin" />}
                    <Trash2 strokeWidth={2.5} />
                    Delete task
                  </Button>
                  <Button size="sm" onClick={() => setEditOpen(true)}>
                    <Pencil className="size-4" /> Edit
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Drill into a subtask to read its full details. */}
      <Dialog
        open={viewingSubtask !== null && !editOpen && !subtaskOpen}
        onOpenChange={(o) => !o && setViewingSubtaskId(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl p-6">
          {viewingSubtask && (
            <>
              <TaskHeaderAndBody
                task={viewingSubtask}
                meta={meta}
                canSetStatus={canSetStatus(viewingSubtask.assignees)}
                statusPending={statusPending}
                onStatusChange={(s) => changeStatus(viewingSubtask.id, s)}
              />

              {canManage && (
                <div className="flex justify-between gap-2 border-t pt-4">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={isDeleting}
                    onClick={() => {
                      removeTask(viewingSubtask.id, true);
                      setViewingSubtaskId(null);
                    }}
                  >
                    {isDeleting && <Loader2 className="size-4 animate-spin" />}
                    <Trash2 strokeWidth={2.5} />
                    Delete subtask
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingSubtask(viewingSubtask);
                      setSubtaskOpen(true);
                    }}
                  >
                    <Pencil className="size-4" /> Edit
                  </Button>
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
          heading={"Subtask"}
          description={editingSubtask ? "Editing" : "Creating New"}
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
