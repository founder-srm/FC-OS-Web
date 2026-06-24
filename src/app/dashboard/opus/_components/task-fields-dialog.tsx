"use client";

import { Link2, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { TaskInputDTO } from "../actions";
import { AssigneePicker } from "./assignee-picker";
import { DueDatePicker } from "./due-date-picker";
import { LabelPicker } from "./label-picker";
import { StatusIcon } from "./status-icon";
import type { DomainMeta, FormValues } from "./types";

const NO_PRIORITY = "none";

export type PendingSubtask = { id: string; input: TaskInputDTO; title: string };

function emptyValues(meta: DomainMeta): FormValues {
  const backlog =
    meta.statuses.find((s) => s.name === "Backlog") ?? meta.statuses[0];
  return {
    title: "",
    description: "",
    statusId: backlog?.id ?? "",
    priorityId: "",
    dueDate: null,
    assigneeIds: [],
    labelIds: [],
    links: [],
  };
}

function toDTO(v: FormValues, showDueDate: boolean): TaskInputDTO {
  return {
    title: v.title.trim(),
    description: v.description.trim() || null,
    statusId: v.statusId,
    priorityId: v.priorityId || null,
    dueDate: showDueDate ? v.dueDate : null,
    assigneeIds: v.assigneeIds,
    labelIds: v.labelIds,
    links: v.links
      .filter((l) => l.url.trim())
      .map((l) => ({ url: l.url.trim(), label: l.label.trim() || null })),
  };
}

export function TaskFieldsDialog({
  open,
  onOpenChange,
  heading,
  description,
  submitLabel,
  meta,
  showDueDate,
  showSubtasks,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  heading: string;
  description?: string;
  submitLabel: string;
  meta: DomainMeta;
  showDueDate: boolean;
  showSubtasks: boolean;
  initial?: FormValues;
  onSubmit: (
    input: TaskInputDTO,
    subtasks: TaskInputDTO[],
  ) => Promise<{ ok: true } | { error: string }>;
}) {
  const [values, setValues] = useState<FormValues>(
    initial ?? emptyValues(meta),
  );
  const [pending, setPending] = useState<PendingSubtask[]>([]);
  const [subtaskOpen, setSubtaskOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSaving, startSaving] = useTransition();

  // Re-seed when the dialog opens for a different task.
  const reset = () => {
    setValues(initial ?? emptyValues(meta));
    setPending([]);
  };

  const set = <K extends keyof FormValues>(key: K, val: FormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  function submit() {
    if (!values.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!values.statusId) {
      toast.error("Pick a status.");
      return;
    }
    startSaving(async () => {
      const res = await onSubmit(
        toDTO(values, showDueDate),
        pending.map((p) => p.input),
      );
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      onOpenChange(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{heading}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Add more detail…"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={values.statusId}
                onValueChange={(v) => set("statusId", v)}
              >
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {meta.statuses.map((s, i) => (
                    <SelectItem key={s.id} value={s.id}>
                      <StatusIcon
                        color={s.color}
                        fraction={(i + 1) / meta.statuses.length}
                      />
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={values.priorityId || NO_PRIORITY}
                onValueChange={(v) =>
                  set("priorityId", v === NO_PRIORITY ? "" : v)
                }
              >
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PRIORITY}>No priority</SelectItem>
                  {meta.priorities.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {showDueDate && (
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <DueDatePicker
                value={values.dueDate}
                onChange={(d) => set("dueDate", d)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Assignees</Label>
            <AssigneePicker
              members={meta.members}
              value={values.assigneeIds}
              onChange={(ids) => set("assigneeIds", ids)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Labels</Label>
            <LabelPicker
              labels={meta.labels}
              value={values.labelIds}
              onChange={(ids) => set("labelIds", ids)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>References</Label>
            <div className="space-y-2">
              {values.links.map((link, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: reference rows have no stable id
                <div key={i} className="flex items-center gap-2">
                  <Link2 className="size-4 shrink-0 text-muted-foreground" />
                  <Input
                    value={link.url}
                    onChange={(e) =>
                      set(
                        "links",
                        values.links.map((l, idx) =>
                          idx === i ? { ...l, url: e.target.value } : l,
                        ),
                      )
                    }
                    placeholder="https://…"
                    className="flex-1"
                  />
                  <Input
                    value={link.label}
                    onChange={(e) =>
                      set(
                        "links",
                        values.links.map((l, idx) =>
                          idx === i ? { ...l, label: e.target.value } : l,
                        ),
                      )
                    }
                    placeholder="Label"
                    className="w-28"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground"
                    onClick={() =>
                      set(
                        "links",
                        values.links.filter((_, idx) => idx !== i),
                      )
                    }
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  set("links", [...values.links, { url: "", label: "" }])
                }
              >
                <Plus className="size-4" /> Add reference
              </Button>
            </div>
          </div>

          {showSubtasks && (
            <div className="space-y-1.5">
              <Label>Subtasks</Label>
              <div className="space-y-2">
                {pending.map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm"
                  >
                    <span className="flex-1 truncate">{p.title}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground"
                      onClick={() => {
                        setEditingIndex(i);
                        setSubtaskOpen(true);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground"
                      onClick={() =>
                        setPending(pending.filter((_, idx) => idx !== i))
                      }
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingIndex(null);
                    setSubtaskOpen(true);
                  }}
                >
                  <Plus className="size-4" /> Add subtask
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={isSaving}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>

      {showSubtasks && subtaskOpen && (
        <TaskFieldsDialog
          open={subtaskOpen}
          onOpenChange={setSubtaskOpen}
          heading={editingIndex === null ? "New subtask" : "Edit subtask"}
          description="Subtasks inherit the parent task's due date."
          submitLabel={editingIndex === null ? "Add" : "Save"}
          meta={meta}
          showDueDate={false}
          showSubtasks={false}
          initial={
            editingIndex === null
              ? undefined
              : dtoToValues(pending[editingIndex].input, meta)
          }
          onSubmit={async (input) => {
            setPending((prev) =>
              editingIndex === null
                ? [
                    ...prev,
                    {
                      id: crypto.randomUUID(),
                      input,
                      title: input.title,
                    },
                  ]
                : prev.map((p, idx) =>
                    idx === editingIndex
                      ? { ...p, input, title: input.title }
                      : p,
                  ),
            );
            return { ok: true } as const;
          }}
        />
      )}
    </Dialog>
  );
}

/** Rebuilds editable form values from a previously collected subtask DTO. */
function dtoToValues(input: TaskInputDTO, meta: DomainMeta): FormValues {
  return {
    title: input.title,
    description: input.description ?? "",
    statusId: input.statusId ?? meta.statuses[0]?.id ?? "",
    priorityId: input.priorityId ?? "",
    dueDate: null,
    assigneeIds: input.assigneeIds ?? [],
    labelIds: input.labelIds ?? [],
    links: (input.links ?? []).map((l) => ({
      url: l.url,
      label: l.label ?? "",
    })),
  };
}
