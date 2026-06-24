"use client";

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { type DomainId, domainIcons, formatDomain } from "@/lib/opus/format";
import {
  addSubtaskAction,
  createTaskAction,
  moveTaskAction,
  type TaskInputDTO,
} from "../actions";
import { StatusIcon } from "./status-icon";
import { TaskCard } from "./task-card";
import { TaskDetailDialog } from "./task-detail-dialog";
import { TaskFieldsDialog } from "./task-fields-dialog";
import type { BoardTask, DomainMeta } from "./types";

type Columns = Record<string, string[]>;

function buildColumns(statusIds: string[], tasks: BoardTask[]): Columns {
  const cols: Columns = {};
  for (const id of statusIds) cols[id] = [];
  for (const t of tasks) {
    if (!cols[t.statusId]) cols[t.statusId] = [];
    cols[t.statusId].push(t.id);
  }
  return cols;
}

function SortableCard({
  task,
  meta,
  statusName,
  onOpen,
}: {
  task: BoardTask;
  meta: DomainMeta;
  statusName: string;
  onOpen: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={isDragging ? "opacity-40" : undefined}
      {...attributes}
      {...listeners}
    >
      <TaskCard
        task={task}
        priorities={meta.priorities}
        labels={meta.labels}
        statusName={statusName}
        onOpen={onOpen}
      />
    </div>
  );
}

function Column({
  statusId,
  name,
  color,
  fraction,
  taskIds,
  taskMap,
  meta,
  onOpen,
}: {
  statusId: string;
  name: string;
  color: string;
  fraction: number;
  taskIds: string[];
  taskMap: Map<string, BoardTask>;
  meta: DomainMeta;
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: statusId });
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <StatusIcon color={color} fraction={fraction} />
        <span className="text-sm font-semibold">{name}</span>
        <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground">
          {taskIds.length}
        </span>
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex min-h-24 flex-1 flex-col gap-2 rounded-lg border border-dashed p-2 transition-colors ${
            isOver ? "border-primary/50 bg-accent/40" : "border-transparent"
          }`}
        >
          {taskIds.map((id) => {
            const task = taskMap.get(id);
            if (!task) return null;
            return (
              <SortableCard
                key={id}
                task={task}
                meta={meta}
                statusName={name}
                onOpen={() => onOpen(id)}
              />
            );
          })}
          {taskIds.length === 0 && (
            <p className="px-1 py-4 text-center text-xs text-muted-foreground">
              No tasks
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function KanbanBoard({
  domain,
  meta,
  tasks,
  canManage,
  currentUserId,
}: {
  domain: string;
  meta: DomainMeta;
  tasks: BoardTask[];
  canManage: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const statusIds = useMemo(
    () => meta.statuses.map((s) => s.id),
    [meta.statuses],
  );
  const statusName = useMemo(
    () => new Map(meta.statuses.map((s) => [s.id, s.name])),
    [meta.statuses],
  );

  const [columns, setColumns] = useState<Columns>(() =>
    buildColumns(statusIds, tasks),
  );
  const [taskMap, setTaskMap] = useState<Map<string, BoardTask>>(
    () => new Map(tasks.map((t) => [t.id, t])),
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Re-sync from the server whenever the board data changes.
  useEffect(() => {
    setColumns(buildColumns(statusIds, tasks));
    setTaskMap(new Map(tasks.map((t) => [t.id, t])));
  }, [statusIds, tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const findContainer = (id: string): string | undefined => {
    if (id in columns) return id;
    return Object.keys(columns).find((key) => columns[key].includes(id));
  };

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragOver(e: DragOverEvent) {
    const activeIdStr = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId) return;
    const from = findContainer(activeIdStr);
    const to = findContainer(overId);
    if (!from || !to || from === to) return;

    setColumns((prev) => {
      const fromItems = prev[from].filter((i) => i !== activeIdStr);
      const toItems = [...prev[to]];
      const overIndex = toItems.indexOf(overId);
      const insertAt = overIndex >= 0 ? overIndex : toItems.length;
      toItems.splice(insertAt, 0, activeIdStr);
      return { ...prev, [from]: fromItems, [to]: toItems };
    });
  }

  function handleDragEnd(e: DragEndEvent) {
    const activeIdStr = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    setActiveId(null);
    if (!overId) return;

    const to = findContainer(overId);
    if (!to) return;

    let nextOrder = columns[to];
    const overIndex = nextOrder.indexOf(overId);
    const activeIndex = nextOrder.indexOf(activeIdStr);
    if (overIndex >= 0 && activeIndex >= 0 && overIndex !== activeIndex) {
      const reordered = [...nextOrder];
      reordered.splice(activeIndex, 1);
      reordered.splice(overIndex, 0, activeIdStr);
      nextOrder = reordered;
      setColumns((prev) => ({ ...prev, [to]: reordered }));
    }

    moveTaskAction(activeIdStr, {
      toStatusId: to,
      targetOrder: nextOrder,
    }).then((res) => {
      if ("error" in res) {
        toast.error(res.error);
        router.refresh();
      }
    });
  }

  const activeTask = activeId ? taskMap.get(activeId) : null;
  const DomainIcon = domainIcons[domain as DomainId];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg border bg-card text-primary">
            <DomainIcon className="size-5" />
          </span>
          <div>
            <h1 className="font-serif text-3xl text-primary">
              {formatDomain(domain)}
            </h1>
            <p className="text-sm text-muted-foreground">
              {tasks.length} task{tasks.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> New task
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 pb-3">
            {meta.statuses.map((s, index) => (
              <Column
                key={s.id}
                statusId={s.id}
                name={s.name}
                color={s.color}
                fraction={(index + 1) / meta.statuses.length}
                taskIds={columns[s.id] ?? []}
                taskMap={taskMap}
                meta={meta}
                onOpen={setOpenTaskId}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask ? (
              <TaskCard
                task={activeTask}
                priorities={meta.priorities}
                labels={meta.labels}
                statusName={statusName.get(activeTask.statusId) ?? ""}
                onOpen={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <TaskDetailDialog
        taskId={openTaskId}
        meta={meta}
        currentUserId={currentUserId}
        canManage={canManage}
        onClose={() => setOpenTaskId(null)}
        onChanged={() => router.refresh()}
      />

      {canManage && createOpen && (
        <TaskFieldsDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          heading="New task"
          description={`Create a task in ${formatDomain(domain)}.`}
          submitLabel="Create task"
          meta={meta}
          showDueDate
          showSubtasks
          onSubmit={async (input: TaskInputDTO, subtasks: TaskInputDTO[]) => {
            const res = await createTaskAction(domain, input);
            if ("error" in res) return res;
            for (const sub of subtasks) {
              await addSubtaskAction(res.id, sub);
            }
            toast.success("Task created.");
            router.refresh();
            return { ok: true } as const;
          }}
        />
      )}
    </div>
  );
}
