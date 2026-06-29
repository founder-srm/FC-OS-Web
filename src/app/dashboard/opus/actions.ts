"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAccessContext, requireWriteAccess } from "@/lib/auth/context";
import { isDomainId } from "@/lib/opus/format";
import { canChangeTaskStatus, canManageDomain } from "@/lib/opus/permissions";
import {
  countTasksWithPriority,
  countTasksWithStatus,
  createOpusLabel,
  createOpusPriority,
  createOpusStatus,
  createOpusTask,
  type DomainId,
  deleteOpusLabel,
  deleteOpusPriority,
  deleteOpusStatus,
  deleteOpusTask,
  getDomainMembers,
  getOpusDomainMeta,
  getOpusTaskDetail,
  getParentDueDate,
  getTaskAuthInfo,
  labelDomain,
  moveOpusTask,
  priorityDomain,
  priorityDomainsByIds,
  reorderOpusPriorities,
  reorderOpusStatuses,
  setOpusStatusFull,
  setOpusTaskStatus,
  statusDomain,
  statusDomainsByIds,
  type TaskWriteInput,
  taskDomainsByIds,
  updateOpusLabel,
  updateOpusPriority,
  updateOpusStatus,
  updateOpusTask,
} from "@/utils/opusDbActions";

export type ActionResult = { ok: true } | { error: string };
export type CreateResult = { ok: true; id: string } | { error: string };

// --- validation ------------------------------------------------------------

const taskInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200),
  description: z
    .string()
    .trim()
    .max(5000)
    .nullish()
    .transform((v) => (v && v.length > 0 ? v : null)),
  statusId: z.string().uuid(),
  priorityId: z.string().uuid().nullable(),
  dueDate: z.coerce.date().nullable(),
  assigneeIds: z.array(z.string().uuid()).default([]),
  labelIds: z.array(z.string().uuid()).default([]),
  links: z
    .array(
      z.object({
        url: z.string().trim().url("Enter a valid URL."),
        label: z
          .string()
          .trim()
          .nullish()
          .transform((v) => (v && v.length > 0 ? v : null)),
      }),
    )
    .default([]),
});

export type TaskInputDTO = z.input<typeof taskInputSchema>;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Parses + checks referential integrity of a task payload within its domain. */
async function parseTaskInput(
  domain: DomainId,
  raw: unknown,
  { allowDueDate }: { allowDueDate: boolean },
): Promise<
  { value: TaskWriteInput; dueDate: Date | null } | { error: string }
> {
  const parsed = taskInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const [meta, members] = await Promise.all([
    getOpusDomainMeta(domain),
    getDomainMembers(domain),
  ]);

  if (!meta.statuses.some((s) => s.id === data.statusId)) {
    return { error: "Unknown status for this domain." };
  }
  if (
    data.priorityId &&
    !meta.priorities.some((p) => p.id === data.priorityId)
  ) {
    return { error: "Unknown priority for this domain." };
  }
  const labelSet = new Set(meta.labels.map((l) => l.id));
  if (!data.labelIds.every((id) => labelSet.has(id))) {
    return { error: "Unknown label for this domain." };
  }
  const memberSet = new Set(members.map((m) => m.id));
  if (!data.assigneeIds.every((id) => memberSet.has(id))) {
    return { error: "Assignee is not a member of this domain." };
  }

  let dueDate: Date | null = null;
  if (allowDueDate && data.dueDate) {
    if (data.dueDate <= startOfToday()) {
      return { error: "Due date must be in the future." };
    }
    dueDate = data.dueDate;
  }

  const value: TaskWriteInput = {
    title: data.title,
    description: data.description,
    statusId: data.statusId,
    priorityId: data.priorityId,
    dueDate,
    assigneeIds: data.assigneeIds,
    labelIds: data.labelIds,
    links: data.links,
  };
  return { value, dueDate };
}

function revalidateBoard(domain: string) {
  revalidatePath(`/dashboard/opus/tasks/${domain}`);
  revalidatePath("/dashboard/opus");
}

// --- tasks -----------------------------------------------------------------

/** Reads a fully-hydrated task (with subtasks) for the detail view. */
export async function loadTaskDetailAction(taskId: string) {
  const ctx = await getAccessContext();
  if (!ctx) return null;
  return getOpusTaskDetail(taskId);
}

export async function createTaskAction(
  domain: string,
  raw: TaskInputDTO,
): Promise<CreateResult> {
  const ctx = await requireWriteAccess();
  if ("error" in ctx) return ctx;
  if (!isDomainId(domain)) return { error: "Unknown domain." };
  if (!canManageDomain(ctx, domain)) {
    return { error: "You can't create tasks in this domain." };
  }

  const parsed = await parseTaskInput(domain, raw, { allowDueDate: true });
  if ("error" in parsed) return parsed;

  const id = await createOpusTask({
    domain,
    parentTaskId: null,
    createdBy: ctx.userId,
    dueDate: parsed.dueDate,
    input: parsed.value,
  });
  revalidateBoard(domain);
  return { ok: true, id };
}

export async function updateTaskAction(
  taskId: string,
  raw: TaskInputDTO,
): Promise<ActionResult> {
  const ctx = await requireWriteAccess();
  if ("error" in ctx) return ctx;

  const info = await getTaskAuthInfo(taskId);
  if (!info) return { error: "Task not found." };
  if (!canManageDomain(ctx, info.domain)) {
    return { error: "You can't edit this task." };
  }

  // Subtasks inherit the parent's due date; top-level tasks set their own.
  const isSubtask = info.parentTaskId !== null;
  const parsed = await parseTaskInput(info.domain, raw, {
    allowDueDate: !isSubtask,
  });
  if ("error" in parsed) return parsed;

  const dueDate = isSubtask
    ? await getParentDueDate(info.parentTaskId as string)
    : parsed.dueDate;

  await updateOpusTask(taskId, parsed.value, dueDate);
  revalidateBoard(info.domain);
  return { ok: true };
}

export async function addSubtaskAction(
  parentTaskId: string,
  raw: TaskInputDTO,
): Promise<CreateResult> {
  const ctx = await requireWriteAccess();
  if ("error" in ctx) return ctx;

  const info = await getTaskAuthInfo(parentTaskId);
  if (!info) return { error: "Parent task not found." };
  if (info.parentTaskId !== null) {
    return { error: "Subtasks can't have their own subtasks." };
  }
  if (!canManageDomain(ctx, info.domain)) {
    return { error: "You can't edit this task." };
  }

  const parsed = await parseTaskInput(info.domain, raw, {
    allowDueDate: false,
  });
  if ("error" in parsed) return parsed;

  const dueDate = await getParentDueDate(parentTaskId);
  const id = await createOpusTask({
    domain: info.domain,
    parentTaskId,
    createdBy: ctx.userId,
    dueDate,
    input: parsed.value,
  });
  revalidateBoard(info.domain);
  return { ok: true, id };
}

const moveSchema = z.object({
  toStatusId: z.string().uuid(),
  targetOrder: z.array(z.string().uuid()),
});

export async function moveTaskAction(
  taskId: string,
  raw: z.input<typeof moveSchema>,
): Promise<ActionResult> {
  const ctx = await requireWriteAccess();
  if ("error" in ctx) return ctx;

  const parsed = moveSchema.safeParse(raw);
  if (!parsed.success) return { error: "Invalid move." };

  const info = await getTaskAuthInfo(taskId);
  if (!info) return { error: "Task not found." };
  if (!canChangeTaskStatus(ctx, info.domain, info.assigneeIds)) {
    return { error: "You can't move this task." };
  }
  if (info.parentTaskId !== null) {
    return { error: "Subtasks can't be moved on the board." };
  }

  const meta = await getOpusDomainMeta(info.domain);
  if (!meta.statuses.some((s) => s.id === parsed.data.toStatusId)) {
    return { error: "Unknown status for this domain." };
  }

  // Every id whose position we rewrite must be a top-level task in this domain.
  const ordered = await taskDomainsByIds(parsed.data.targetOrder);
  if (
    ordered.length !== parsed.data.targetOrder.length ||
    ordered.some((t) => t.domain !== info.domain || t.parentTaskId !== null)
  ) {
    return { error: "Invalid move." };
  }

  await moveOpusTask(taskId, parsed.data.toStatusId, parsed.data.targetOrder);
  revalidateBoard(info.domain);
  return { ok: true };
}

/**
 * Status-only change for a single task or subtask — the one mutation assigned
 * members (non-managers) may perform. Works for subtasks too (no board-position
 * rewrite, unlike `moveTaskAction`).
 */
export async function setTaskStatusAction(
  taskId: string,
  statusId: string,
): Promise<ActionResult> {
  const ctx = await requireWriteAccess();
  if ("error" in ctx) return ctx;

  const info = await getTaskAuthInfo(taskId);
  if (!info) return { error: "Task not found." };
  if (!canChangeTaskStatus(ctx, info.domain, info.assigneeIds)) {
    return { error: "You can't change this task's status." };
  }

  const meta = await getOpusDomainMeta(info.domain);
  if (!meta.statuses.some((s) => s.id === statusId)) {
    return { error: "Unknown status for this domain." };
  }

  await setOpusTaskStatus(taskId, statusId);
  revalidateBoard(info.domain);
  return { ok: true };
}

export async function deleteTaskAction(taskId: string): Promise<ActionResult> {
  const ctx = await requireWriteAccess();
  if ("error" in ctx) return ctx;

  const info = await getTaskAuthInfo(taskId);
  if (!info) return { error: "Task not found." };
  if (!canManageDomain(ctx, info.domain)) {
    return { error: "You can't delete tasks in this domain." };
  }

  await deleteOpusTask(taskId);
  revalidateBoard(info.domain);
  return { ok: true };
}

// --- statuses / priorities / labels (Manage) -------------------------------

function revalidateManage(domain: string) {
  revalidatePath(`/dashboard/opus/manage/${domain}`);
  revalidatePath(`/dashboard/opus/tasks/${domain}`);
}

async function requireManager(domain: string) {
  const ctx = await requireWriteAccess();
  if ("error" in ctx) return ctx;
  if (!isDomainId(domain)) return { error: "Unknown domain." };
  if (!canManageDomain(ctx, domain)) {
    return { error: "You can't manage this domain." };
  }
  return ctx;
}

const nameSchema = z.string().trim().min(1, "Name is required.").max(60);
const colorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Pick a color.");

export async function createStatusAction(
  domain: string,
  name: string,
  color: string,
): Promise<ActionResult> {
  const ctx = await requireManager(domain);
  if ("error" in ctx) return ctx;
  const n = nameSchema.safeParse(name);
  if (!n.success) return { error: n.error.issues[0].message };
  const c = colorSchema.safeParse(color);
  if (!c.success) return { error: c.error.issues[0].message };
  await createOpusStatus(domain as DomainId, n.data, c.data);
  revalidateManage(domain);
  return { ok: true };
}

export async function updateStatusAction(
  domain: string,
  id: string,
  name: string,
  color: string,
): Promise<ActionResult> {
  const ctx = await requireManager(domain);
  if ("error" in ctx) return ctx;
  const n = nameSchema.safeParse(name);
  if (!n.success) return { error: n.error.issues[0].message };
  const c = colorSchema.safeParse(color);
  if (!c.success) return { error: c.error.issues[0].message };
  if ((await statusDomain(id)) !== domain) {
    return { error: "Unknown status for this domain." };
  }
  await updateOpusStatus(id, n.data, c.data);
  revalidateManage(domain);
  return { ok: true };
}

export async function deleteStatusAction(
  domain: string,
  id: string,
): Promise<ActionResult> {
  const ctx = await requireManager(domain);
  if ("error" in ctx) return ctx;
  if ((await statusDomain(id)) !== domain) {
    return { error: "Unknown status for this domain." };
  }
  if ((await countTasksWithStatus(id)) > 0) {
    return { error: "Move or delete its tasks before removing this status." };
  }
  await deleteOpusStatus(id);
  revalidateManage(domain);
  return { ok: true };
}

export async function reorderStatusesAction(
  domain: string,
  orderedIds: string[],
): Promise<ActionResult> {
  const ctx = await requireManager(domain);
  if ("error" in ctx) return ctx;
  const domains = await statusDomainsByIds(orderedIds);
  if (
    domains.length !== orderedIds.length ||
    domains.some((d) => d !== domain)
  ) {
    return { error: "Unknown status for this domain." };
  }
  await reorderOpusStatuses(orderedIds);
  revalidateManage(domain);
  return { ok: true };
}

/**
 * Toggle a status's full/dynamic ring and reorder in one shot. `orderedIds` is the full
 * status order the client computed (dynamic block first, full block last) — re-validated
 * server-side so all ids belong to the domain.
 */
export async function setStatusFullAction(
  domain: string,
  id: string,
  ringFull: boolean,
  orderedIds: string[],
): Promise<ActionResult> {
  const ctx = await requireManager(domain);
  if ("error" in ctx) return ctx;
  const domains = await statusDomainsByIds(orderedIds);
  if (
    domains.length !== orderedIds.length ||
    domains.some((d) => d !== domain) ||
    !orderedIds.includes(id)
  ) {
    return { error: "Unknown status for this domain." };
  }
  await setOpusStatusFull(id, ringFull, orderedIds);
  revalidateManage(domain);
  return { ok: true };
}

export async function createPriorityAction(
  domain: string,
  name: string,
): Promise<ActionResult> {
  const ctx = await requireManager(domain);
  if ("error" in ctx) return ctx;
  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await createOpusPriority(domain as DomainId, parsed.data);
  revalidateManage(domain);
  return { ok: true };
}

export async function renamePriorityAction(
  domain: string,
  id: string,
  name: string,
): Promise<ActionResult> {
  const ctx = await requireManager(domain);
  if ("error" in ctx) return ctx;
  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if ((await priorityDomain(id)) !== domain) {
    return { error: "Unknown priority for this domain." };
  }
  await updateOpusPriority(id, parsed.data);
  revalidateManage(domain);
  return { ok: true };
}

export async function deletePriorityAction(
  domain: string,
  id: string,
): Promise<ActionResult> {
  const ctx = await requireManager(domain);
  if ("error" in ctx) return ctx;
  if ((await priorityDomain(id)) !== domain) {
    return { error: "Unknown priority for this domain." };
  }
  if ((await countTasksWithPriority(id)) > 0) {
    return { error: "This priority is in use by some tasks." };
  }
  await deleteOpusPriority(id);
  revalidateManage(domain);
  return { ok: true };
}

export async function reorderPrioritiesAction(
  domain: string,
  orderedIds: string[],
): Promise<ActionResult> {
  const ctx = await requireManager(domain);
  if ("error" in ctx) return ctx;
  const domains = await priorityDomainsByIds(orderedIds);
  if (
    domains.length !== orderedIds.length ||
    domains.some((d) => d !== domain)
  ) {
    return { error: "Unknown priority for this domain." };
  }
  await reorderOpusPriorities(orderedIds);
  revalidateManage(domain);
  return { ok: true };
}

export async function createLabelAction(
  domain: string,
  name: string,
  color: string,
): Promise<ActionResult> {
  const ctx = await requireManager(domain);
  if ("error" in ctx) return ctx;
  const n = nameSchema.safeParse(name);
  if (!n.success) return { error: n.error.issues[0].message };
  const c = colorSchema.safeParse(color);
  if (!c.success) return { error: c.error.issues[0].message };
  await createOpusLabel(domain as DomainId, n.data, c.data);
  revalidateManage(domain);
  return { ok: true };
}

export async function updateLabelAction(
  domain: string,
  id: string,
  name: string,
  color: string,
): Promise<ActionResult> {
  const ctx = await requireManager(domain);
  if ("error" in ctx) return ctx;
  const n = nameSchema.safeParse(name);
  if (!n.success) return { error: n.error.issues[0].message };
  const c = colorSchema.safeParse(color);
  if (!c.success) return { error: c.error.issues[0].message };
  if ((await labelDomain(id)) !== domain) {
    return { error: "Unknown label for this domain." };
  }
  await updateOpusLabel(id, n.data, c.data);
  revalidateManage(domain);
  return { ok: true };
}

export async function deleteLabelAction(
  domain: string,
  id: string,
): Promise<ActionResult> {
  const ctx = await requireManager(domain);
  if ("error" in ctx) return ctx;
  if ((await labelDomain(id)) !== domain) {
    return { error: "Unknown label for this domain." };
  }
  await deleteOpusLabel(id);
  revalidateManage(domain);
  return { ok: true };
}
