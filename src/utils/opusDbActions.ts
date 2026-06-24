// Opus (PM tool) DB actions / query helpers. Mirrors the trust-boundary
// convention in `dbActions.ts`: writes that cross a trust boundary go through
// validation + access control in the calling Server Action; these helpers own
// the actual SQL. Everything is domain-scoped and data-driven so a newly seeded
// domain surfaces automatically.

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../database/db";
import type { domainsEnum } from "../database/schemas/domains";
import { type OpusLabel, opusLabels } from "../database/schemas/opus_labels";
import {
  type OpusPriority,
  opusPriorities,
} from "../database/schemas/opus_priorities";
import {
  type OpusStatus,
  opusStatuses,
} from "../database/schemas/opus_statuses";
import { opusTaskAssignees } from "../database/schemas/opus_task_assignees";
import { opusTaskLabels } from "../database/schemas/opus_task_labels";
import { opusTaskLinks } from "../database/schemas/opus_task_links";
import { type OpusTask, opusTasks } from "../database/schemas/opus_tasks";
import { profiles } from "../database/schemas/profiles";
import { userRoles } from "../database/schemas/user_roles";

export type DomainId = (typeof domainsEnum.enumValues)[number];

export type BoardAssignee = {
  id: string;
  firstName: string;
  lastName: string;
};

export type BoardTask = OpusTask & {
  assignees: BoardAssignee[];
  labelIds: string[];
  subtaskCount: number;
  linkCount: number;
};

export type OpusBoard = {
  statuses: OpusStatus[];
  priorities: OpusPriority[];
  labels: OpusLabel[];
  tasks: BoardTask[];
};

export type TaskLink = { id: string; url: string; label: string | null };

export type TaskFull = OpusTask & {
  assignees: BoardAssignee[];
  labelIds: string[];
  links: TaskLink[];
};

export type TaskDetail = TaskFull & { subtasks: TaskFull[] };

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** Per-domain statuses / priorities / labels — for pickers and the Manage UI. */
export const getOpusDomainMeta = async (domain: DomainId) => {
  const [statuses, priorities, labels] = await Promise.all([
    db
      .select()
      .from(opusStatuses)
      .where(eq(opusStatuses.domain, domain))
      .orderBy(asc(opusStatuses.position)),
    db
      .select()
      .from(opusPriorities)
      .where(eq(opusPriorities.domain, domain))
      .orderBy(asc(opusPriorities.position)),
    db
      .select()
      .from(opusLabels)
      .where(eq(opusLabels.domain, domain))
      .orderBy(asc(opusLabels.name)),
  ]);
  return { statuses, priorities, labels };
};

/** Assignees keyed by task id, for a set of tasks. */
const assigneesByTask = async (taskIds: string[]) => {
  const map = new Map<string, BoardAssignee[]>();
  if (taskIds.length === 0) return map;
  const rows = await db
    .select({
      taskId: opusTaskAssignees.taskId,
      id: profiles.id,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
    })
    .from(opusTaskAssignees)
    .innerJoin(profiles, eq(profiles.id, opusTaskAssignees.userId))
    .where(inArray(opusTaskAssignees.taskId, taskIds));
  for (const r of rows) {
    const list = map.get(r.taskId) ?? [];
    list.push({ id: r.id, firstName: r.firstName, lastName: r.lastName });
    map.set(r.taskId, list);
  }
  return map;
};

/** Label ids keyed by task id, for a set of tasks. */
const labelIdsByTask = async (taskIds: string[]) => {
  const map = new Map<string, string[]>();
  if (taskIds.length === 0) return map;
  const rows = await db
    .select({
      taskId: opusTaskLabels.taskId,
      labelId: opusTaskLabels.labelId,
    })
    .from(opusTaskLabels)
    .where(inArray(opusTaskLabels.taskId, taskIds));
  for (const r of rows) {
    const list = map.get(r.taskId) ?? [];
    list.push(r.labelId);
    map.set(r.taskId, list);
  }
  return map;
};

/**
 * Full board for one domain: ordered statuses + top-level tasks hydrated with
 * assignees, label ids, and subtask / link counts; plus the domain's priorities
 * and labels for rendering and pickers.
 */
export const getOpusBoard = async (domain: DomainId): Promise<OpusBoard> => {
  const [meta, allTasks] = await Promise.all([
    getOpusDomainMeta(domain),
    db
      .select()
      .from(opusTasks)
      .where(eq(opusTasks.domain, domain))
      .orderBy(asc(opusTasks.position)),
  ]);

  const topLevel = allTasks.filter((t) => t.parentTaskId === null);
  const topIds = topLevel.map((t) => t.id);

  const subtaskCount = new Map<string, number>();
  const linkCountMap = new Map<string, number>();
  for (const t of allTasks) {
    if (t.parentTaskId) {
      subtaskCount.set(
        t.parentTaskId,
        (subtaskCount.get(t.parentTaskId) ?? 0) + 1,
      );
    }
  }

  const [assignees, labelIds, linkRows] = await Promise.all([
    assigneesByTask(topIds),
    labelIdsByTask(topIds),
    topIds.length === 0
      ? Promise.resolve([] as { taskId: string }[])
      : db
          .select({ taskId: opusTaskLinks.taskId })
          .from(opusTaskLinks)
          .where(inArray(opusTaskLinks.taskId, topIds)),
  ]);
  for (const r of linkRows) {
    linkCountMap.set(r.taskId, (linkCountMap.get(r.taskId) ?? 0) + 1);
  }

  const tasks: BoardTask[] = topLevel.map((t) => ({
    ...t,
    assignees: assignees.get(t.id) ?? [],
    labelIds: labelIds.get(t.id) ?? [],
    subtaskCount: subtaskCount.get(t.id) ?? 0,
    linkCount: linkCountMap.get(t.id) ?? 0,
  }));

  return { ...meta, tasks };
};

const hydrateFull = async (tasks: OpusTask[]): Promise<TaskFull[]> => {
  const ids = tasks.map((t) => t.id);
  const [assignees, labelIds, links] = await Promise.all([
    assigneesByTask(ids),
    labelIdsByTask(ids),
    ids.length === 0
      ? Promise.resolve(
          [] as {
            taskId: string;
            id: string;
            url: string;
            label: string | null;
          }[],
        )
      : db
          .select({
            taskId: opusTaskLinks.taskId,
            id: opusTaskLinks.id,
            url: opusTaskLinks.url,
            label: opusTaskLinks.label,
          })
          .from(opusTaskLinks)
          .where(inArray(opusTaskLinks.taskId, ids)),
  ]);
  const linksByTask = new Map<string, TaskLink[]>();
  for (const l of links) {
    const list = linksByTask.get(l.taskId) ?? [];
    list.push({ id: l.id, url: l.url, label: l.label });
    linksByTask.set(l.taskId, list);
  }
  return tasks.map((t) => ({
    ...t,
    assignees: assignees.get(t.id) ?? [],
    labelIds: labelIds.get(t.id) ?? [],
    links: linksByTask.get(t.id) ?? [],
  }));
};

/** A single task fully hydrated, including its subtasks (also hydrated). */
export const getOpusTaskDetail = async (
  taskId: string,
): Promise<TaskDetail | null> => {
  const [task] = await db
    .select()
    .from(opusTasks)
    .where(eq(opusTasks.id, taskId))
    .limit(1);
  if (!task) return null;

  const subtaskRows = await db
    .select()
    .from(opusTasks)
    .where(eq(opusTasks.parentTaskId, taskId))
    .orderBy(asc(opusTasks.position));

  const [[full], subtasks] = await Promise.all([
    hydrateFull([task]),
    hydrateFull(subtaskRows),
  ]);

  return { ...full, subtasks };
};

/** Approved members who belong to a domain — the assignee picker source. */
export const getDomainMembers = async (
  domain: DomainId,
): Promise<BoardAssignee[]> => {
  const rows = await db
    .selectDistinct({
      id: profiles.id,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
    })
    .from(profiles)
    .innerJoin(userRoles, eq(userRoles.id, profiles.id))
    .where(and(eq(userRoles.domain, domain), eq(profiles.status, "approved")))
    .orderBy(asc(profiles.firstName));
  return rows;
};

export type OpusOverview = {
  total: number;
  byStatus: { name: string; count: number }[];
  byDomain: { domain: string; count: number }[];
  overdue: number;
  dueSoon: number;
  recent: {
    id: string;
    title: string;
    domain: string;
    statusName: string;
    dueDate: Date | null;
  }[];
};

const DONE_STATUS_NAMES = new Set(["Done", "Cancelled"]);

/** Dashboard rollup of every task assigned to a user across all domains. */
export const getOpusOverview = async (
  userId: string,
): Promise<OpusOverview> => {
  const rows = await db
    .select({
      id: opusTasks.id,
      title: opusTasks.title,
      domain: opusTasks.domain,
      dueDate: opusTasks.dueDate,
      updatedAt: opusTasks.updatedAt,
      statusName: opusStatuses.name,
    })
    .from(opusTaskAssignees)
    .innerJoin(opusTasks, eq(opusTasks.id, opusTaskAssignees.taskId))
    .innerJoin(opusStatuses, eq(opusStatuses.id, opusTasks.statusId))
    .where(eq(opusTaskAssignees.userId, userId))
    .orderBy(desc(opusTasks.updatedAt));

  const now = Date.now();
  const soon = now + 7 * 24 * 60 * 60 * 1000;
  const byStatus = new Map<string, number>();
  const byDomain = new Map<string, number>();
  let overdue = 0;
  let dueSoon = 0;

  for (const r of rows) {
    byStatus.set(r.statusName, (byStatus.get(r.statusName) ?? 0) + 1);
    byDomain.set(r.domain, (byDomain.get(r.domain) ?? 0) + 1);
    const open = !DONE_STATUS_NAMES.has(r.statusName);
    if (r.dueDate && open) {
      const due = r.dueDate.getTime();
      if (due < now) overdue += 1;
      else if (due <= soon) dueSoon += 1;
    }
  }

  return {
    total: rows.length,
    byStatus: [...byStatus].map(([name, count]) => ({ name, count })),
    byDomain: [...byDomain].map(([domain, count]) => ({ domain, count })),
    overdue,
    dueSoon,
    recent: rows.slice(0, 6).map((r) => ({
      id: r.id,
      title: r.title,
      domain: r.domain,
      statusName: r.statusName,
      dueDate: r.dueDate,
    })),
  };
};

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/** The transaction handle passed to a `db.transaction` callback. */
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type TaskWriteInput = {
  title: string;
  description: string | null;
  statusId: string;
  priorityId: string | null;
  dueDate: Date | null;
  assigneeIds: string[];
  labelIds: string[];
  links: { url: string; label: string | null }[];
};

const nextPosition = async (domain: DomainId, statusId: string) => {
  const [row] = await db
    .select({
      next: sql<number>`coalesce(max(${opusTasks.position}), -1) + 1`,
    })
    .from(opusTasks)
    .where(and(eq(opusTasks.domain, domain), eq(opusTasks.statusId, statusId)));
  return row?.next ?? 0;
};

/** Inserts a task's assignee / label / link join rows within a transaction. */
const insertChildJoinRows = async (
  tx: Tx,
  taskId: string,
  input: Pick<TaskWriteInput, "assigneeIds" | "labelIds" | "links">,
) => {
  if (input.assigneeIds.length > 0) {
    await tx
      .insert(opusTaskAssignees)
      .values(input.assigneeIds.map((userId) => ({ taskId, userId })));
  }
  if (input.labelIds.length > 0) {
    await tx
      .insert(opusTaskLabels)
      .values(input.labelIds.map((labelId) => ({ taskId, labelId })));
  }
  if (input.links.length > 0) {
    await tx
      .insert(opusTaskLinks)
      .values(input.links.map((l) => ({ taskId, url: l.url, label: l.label })));
  }
};

/**
 * Creates a task (or subtask) plus its assignee / label / link rows. Subtasks
 * inherit the parent's due date and share its domain. Atomic via a transaction.
 */
export const createOpusTask = async (params: {
  domain: DomainId;
  parentTaskId: string | null;
  createdBy: string;
  dueDate: Date | null;
  input: TaskWriteInput;
}) => {
  const taskId = crypto.randomUUID();
  const position = await nextPosition(params.domain, params.input.statusId);

  await db.transaction(async (tx) => {
    await tx.insert(opusTasks).values({
      id: taskId,
      domain: params.domain,
      parentTaskId: params.parentTaskId,
      title: params.input.title,
      description: params.input.description,
      statusId: params.input.statusId,
      priorityId: params.input.priorityId,
      dueDate: params.dueDate,
      position,
      createdBy: params.createdBy,
    });
    await insertChildJoinRows(tx, taskId, params.input);
  });
  return taskId;
};

/** Replaces a task's editable fields and its assignee / label / link sets. */
export const updateOpusTask = async (
  taskId: string,
  input: TaskWriteInput,
  dueDate: Date | null,
) => {
  await db.transaction(async (tx) => {
    await tx
      .update(opusTasks)
      .set({
        title: input.title,
        description: input.description,
        statusId: input.statusId,
        priorityId: input.priorityId,
        dueDate,
        updatedAt: new Date(),
      })
      .where(eq(opusTasks.id, taskId));
    await tx
      .delete(opusTaskAssignees)
      .where(eq(opusTaskAssignees.taskId, taskId));
    await tx.delete(opusTaskLabels).where(eq(opusTaskLabels.taskId, taskId));
    await tx.delete(opusTaskLinks).where(eq(opusTaskLinks.taskId, taskId));
    await insertChildJoinRows(tx, taskId, input);
  });
};

export const deleteOpusTask = async (taskId: string) => {
  await db.delete(opusTasks).where(eq(opusTasks.id, taskId));
};

/**
 * Persists a drag-and-drop move: sets the moved task's status and rewrites the
 * positions of every task in the target column to match the client's order.
 */
export const moveOpusTask = async (
  taskId: string,
  toStatusId: string,
  targetOrder: string[],
) => {
  await db.transaction(async (tx) => {
    await tx
      .update(opusTasks)
      .set({ statusId: toStatusId, updatedAt: new Date() })
      .where(eq(opusTasks.id, taskId));
    for (const [index, id] of targetOrder.entries()) {
      await tx
        .update(opusTasks)
        .set({ position: index })
        .where(eq(opusTasks.id, id));
    }
  });
};

// --- Statuses / priorities / labels (Manage) -------------------------------

const nextMetaPosition = async (
  table: typeof opusStatuses | typeof opusPriorities,
  domain: DomainId,
) => {
  const [row] = await db
    .select({ next: sql<number>`coalesce(max(${table.position}), -1) + 1` })
    .from(table)
    .where(eq(table.domain, domain));
  return row?.next ?? 0;
};

export const createOpusStatus = async (
  domain: DomainId,
  name: string,
  color: string,
) => {
  const position = await nextMetaPosition(opusStatuses, domain);
  await db.insert(opusStatuses).values({ domain, name, position, color });
};

export const updateOpusStatus = async (
  id: string,
  name: string,
  color: string,
) => {
  await db
    .update(opusStatuses)
    .set({ name, color })
    .where(eq(opusStatuses.id, id));
};

export const reorderOpusStatuses = async (orderedIds: string[]) => {
  if (orderedIds.length === 0) return;
  await db.transaction(async (tx) => {
    for (const [index, id] of orderedIds.entries()) {
      await tx
        .update(opusStatuses)
        .set({ position: index })
        .where(eq(opusStatuses.id, id));
    }
  });
};

export const createOpusPriority = async (domain: DomainId, name: string) => {
  const position = await nextMetaPosition(opusPriorities, domain);
  await db.insert(opusPriorities).values({ domain, name, position });
};

export const updateOpusPriority = async (id: string, name: string) => {
  await db
    .update(opusPriorities)
    .set({ name })
    .where(eq(opusPriorities.id, id));
};

export const reorderOpusPriorities = async (orderedIds: string[]) => {
  if (orderedIds.length === 0) return;
  await db.transaction(async (tx) => {
    for (const [index, id] of orderedIds.entries()) {
      await tx
        .update(opusPriorities)
        .set({ position: index })
        .where(eq(opusPriorities.id, id));
    }
  });
};

export const createOpusLabel = async (
  domain: DomainId,
  name: string,
  color: string,
) => {
  await db.insert(opusLabels).values({ domain, name, color });
};

export const updateOpusLabel = async (
  id: string,
  name: string,
  color: string,
) => {
  await db.update(opusLabels).set({ name, color }).where(eq(opusLabels.id, id));
};

export const deleteOpusLabel = async (id: string) => {
  await db.delete(opusLabels).where(eq(opusLabels.id, id));
};

/** Count of tasks referencing a status / priority — used to guard deletes. */
export const countTasksWithStatus = async (statusId: string) => {
  const [row] = await db
    .select({ c: sql<number>`count(*)` })
    .from(opusTasks)
    .where(eq(opusTasks.statusId, statusId));
  return Number(row?.c ?? 0);
};

export const countTasksWithPriority = async (priorityId: string) => {
  const [row] = await db
    .select({ c: sql<number>`count(*)` })
    .from(opusTasks)
    .where(eq(opusTasks.priorityId, priorityId));
  return Number(row?.c ?? 0);
};

export const deleteOpusStatus = async (id: string) => {
  await db.delete(opusStatuses).where(eq(opusStatuses.id, id));
};

export const deleteOpusPriority = async (id: string) => {
  await db.delete(opusPriorities).where(eq(opusPriorities.id, id));
};

/** Domain of a task, for authorization in Server Actions. */
export const getTaskAuthInfo = async (taskId: string) => {
  const [row] = await db
    .select({ domain: opusTasks.domain, parentTaskId: opusTasks.parentTaskId })
    .from(opusTasks)
    .where(eq(opusTasks.id, taskId))
    .limit(1);
  if (!row) return null;
  const assignees = await db
    .select({ userId: opusTaskAssignees.userId })
    .from(opusTaskAssignees)
    .where(eq(opusTaskAssignees.taskId, taskId));
  return {
    domain: row.domain as DomainId,
    parentTaskId: row.parentTaskId,
    assigneeIds: assignees.map((a) => a.userId),
  };
};

/** Whether a task is a top-level task (used to gate subtask creation). */
export const isTopLevelTask = async (taskId: string) => {
  const [row] = await db
    .select({ parentTaskId: opusTasks.parentTaskId })
    .from(opusTasks)
    .where(eq(opusTasks.id, taskId))
    .limit(1);
  return row ? row.parentTaskId === null : false;
};

/** Parent task's due date — subtasks inherit it. */
export const getParentDueDate = async (parentTaskId: string) => {
  const [row] = await db
    .select({ dueDate: opusTasks.dueDate })
    .from(opusTasks)
    .where(eq(opusTasks.id, parentTaskId))
    .limit(1);
  return row?.dueDate ?? null;
};
