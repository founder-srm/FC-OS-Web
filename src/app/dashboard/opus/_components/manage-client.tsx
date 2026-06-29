"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OpusLabel } from "@/database/schemas/opus_labels";
import type { OpusPriority } from "@/database/schemas/opus_priorities";
import type { OpusStatus } from "@/database/schemas/opus_statuses";
import { formatDomain, statusFraction } from "@/lib/opus/format";
import {
  type ActionResult,
  createLabelAction,
  createPriorityAction,
  createStatusAction,
  deleteLabelAction,
  deletePriorityAction,
  deleteStatusAction,
  renamePriorityAction,
  reorderPrioritiesAction,
  reorderStatusesAction,
  setStatusFullAction,
  updateLabelAction,
  updateStatusAction,
} from "../actions";
import { StatusIcon } from "./status-icon";

type MetaItem = (OpusStatus | OpusPriority) & { color?: string };

const DEFAULT_STATUS_COLOR = "#6b7280";

// Status rows can carry a full/dynamic ring flag; priorities can't.
const isFull = (item: MetaItem) => "ringFull" in item && item.ringFull === true;

function OrderedMetaSection({
  description,
  noun,
  items,
  withColor = false,
  ringToggle = false,
  onCreate,
  onRename,
  onDelete,
  onReorder,
  onToggleFull,
}: {
  description: string;
  noun: string;
  items: MetaItem[];
  withColor?: boolean;
  /** Enables the per-row full/dynamic ring toggle + ordering rule (statuses only). */
  ringToggle?: boolean;
  onCreate: (name: string, color?: string) => Promise<ActionResult>;
  onRename: (id: string, name: string, color?: string) => Promise<ActionResult>;
  onDelete: (id: string) => Promise<ActionResult>;
  onReorder: (orderedIds: string[]) => Promise<ActionResult>;
  onToggleFull?: (
    id: string,
    next: boolean,
    orderedIds: string[],
  ) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(DEFAULT_STATUS_COLOR);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isPending, start] = useTransition();

  const colorOf = (item: MetaItem) => item.color ?? DEFAULT_STATUS_COLOR;

  const run = (fn: () => Promise<ActionResult>, ok: string) =>
    start(async () => {
      const res = await fn();
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(ok);
      router.refresh();
    });

  // Dynamic statuses must stay above all full ones: the full flags, read in order,
  // must be all-false then all-true (no dynamic after a full).
  const orderIsValid = (ordered: MetaItem[]) => {
    let seenFull = false;
    for (const item of ordered) {
      if (isFull(item)) seenFull = true;
      else if (seenFull) return false;
    }
    return true;
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    if (ringToggle && !orderIsValid(next)) {
      toast.error("Dynamic statuses must stay above full ones.");
      return;
    }
    run(() => onReorder(next.map((i) => i.id)), "Reordered.");
  };

  // Toggle a status full/dynamic, re-sorting so dynamics stay above fulls. A new full
  // sinks to the top of the full block; a new dynamic rises to the bottom of the
  // dynamic block.
  const toggleFull = (item: MetaItem, next: boolean) => {
    if (!onToggleFull) return;
    const dynamics = items.filter((i) => !isFull(i) && i.id !== item.id);
    const fulls = items.filter((i) => isFull(i) && i.id !== item.id);
    // Inserting `item` between the two blocks lands it at the bottom of the dynamic
    // block (→dynamic) or the top of the full block (→full) — valid either way.
    const ordered = [...dynamics, item, ...fulls];
    run(
      () =>
        onToggleFull(
          item.id,
          next,
          ordered.map((i) => i.id),
        ),
      next ? "Marked full." : "Marked dynamic.",
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-2 rounded-md border px-2.5 py-1.5"
          >
            <div className="flex flex-col">
              <Button
                variant="ghost"
                size="icon"
                className="size-5 text-muted-foreground"
                disabled={isPending || index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowUp className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-5 text-muted-foreground"
                disabled={isPending || index === items.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDown className="size-3.5" />
              </Button>
            </div>

            {editingId === item.id ? (
              <>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 flex-1"
                  autoFocus
                />
                <Button
                  size="icon"
                  className="size-8"
                  disabled={isPending || !editName.trim()}
                  onClick={() => {
                    run(
                      () => onRename(item.id, editName, colorOf(item)),
                      "Renamed.",
                    );
                    setEditingId(null);
                  }}
                >
                  <Check className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setEditingId(null)}
                >
                  <X className="size-4" />
                </Button>
              </>
            ) : (
              <>
                {withColor && (
                  <StatusIcon
                    color={colorOf(item)}
                    fraction={
                      ringToggle
                        ? statusFraction(
                            items.map((i) => ({
                              id: i.id,
                              ringFull: isFull(i),
                            })),
                            item.id,
                          )
                        : (index + 1) / items.length
                    }
                  />
                )}
                <span className="flex-1 text-sm">{item.name}</span>
                {ringToggle && onToggleFull && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs font-normal text-muted-foreground"
                    disabled={isPending}
                    onClick={() => toggleFull(item, !isFull(item))}
                  >
                    {isFull(item) ? "Full" : "Dynamic"}
                  </Button>
                )}
                {withColor && (
                  <input
                    type="color"
                    defaultValue={colorOf(item)}
                    className="size-7 cursor-pointer rounded border bg-transparent"
                    disabled={isPending}
                    onBlur={(e) => {
                      if (e.target.value !== colorOf(item))
                        run(
                          () => onRename(item.id, item.name, e.target.value),
                          "Recolored.",
                        );
                    }}
                  />
                )}
                {item.isDefault && (
                  <Badge variant="secondary" className="text-[10px]">
                    default
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground"
                  onClick={() => {
                    setEditingId(item.id);
                    setEditName(item.name);
                  }}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground"
                  disabled={isPending}
                  onClick={() =>
                    run(() => onDelete(item.id), `${noun} deleted.`)
                  }
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1">
        {withColor && (
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="size-9 cursor-pointer rounded border bg-transparent"
          />
        )}
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={`New ${noun.toLowerCase()}…`}
          className="h-9"
          onKeyDown={(e) => {
            if (e.key === "Enter" && newName.trim()) {
              run(
                () => onCreate(newName, withColor ? newColor : undefined),
                `${noun} added.`,
              );
              setNewName("");
            }
          }}
        />
        <Button
          disabled={isPending || !newName.trim()}
          onClick={() => {
            run(
              () => onCreate(newName, withColor ? newColor : undefined),
              `${noun} added.`,
            );
            setNewName("");
          }}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Add
        </Button>
      </div>
    </div>
  );
}

function LabelsSection({
  domain,
  labels,
}: {
  domain: string;
  labels: OpusLabel[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#16a34a");
  const [isPending, start] = useTransition();

  const run = (fn: () => Promise<ActionResult>, ok: string) =>
    start(async () => {
      const res = await fn();
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(ok);
      router.refresh();
    });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Labels are free-form tags for tasks in {formatDomain(domain)}.
      </p>
      <div className="space-y-2">
        {labels.length === 0 && (
          <p className="text-sm text-muted-foreground">No labels yet.</p>
        )}
        {labels.map((l) => (
          <div
            key={l.id}
            className="flex items-center gap-2 rounded-md border px-2.5 py-1.5"
          >
            <input
              type="color"
              defaultValue={l.color}
              className="size-7 cursor-pointer rounded border bg-transparent"
              onBlur={(e) => {
                if (e.target.value !== l.color)
                  run(
                    () =>
                      updateLabelAction(domain, l.id, l.name, e.target.value),
                    "Label updated.",
                  );
              }}
            />
            <DefaultEditableName
              value={l.name}
              onSave={(v) =>
                run(
                  () => updateLabelAction(domain, l.id, v, l.color),
                  "Label updated.",
                )
              }
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              disabled={isPending}
              onClick={() =>
                run(() => deleteLabelAction(domain, l.id), "Label deleted.")
              }
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="size-9 cursor-pointer rounded border bg-transparent"
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New label…"
          className="h-9"
        />
        <Button
          disabled={isPending || !name.trim()}
          onClick={() => {
            run(() => createLabelAction(domain, name, color), "Label added.");
            setName("");
          }}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Add
        </Button>
      </div>
    </div>
  );
}

function DefaultEditableName({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editing) {
    return (
      <button
        type="button"
        className="flex-1 text-left text-sm"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
      >
        {value}
      </button>
    );
  }
  return (
    <Input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      className="h-8 flex-1"
      autoFocus
      onBlur={() => {
        setEditing(false);
        if (draft.trim() && draft !== value) onSave(draft.trim());
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") setEditing(false);
      }}
    />
  );
}

export function ManageClient({
  domain,
  statuses,
  priorities,
  labels,
}: {
  domain: string;
  statuses: OpusStatus[];
  priorities: OpusPriority[];
  labels: OpusLabel[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl text-primary">
          Manage · {formatDomain(domain)}
        </h1>
        <p className="text-sm text-muted-foreground">
          Customize the board for this domain.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Board configuration</CardTitle>
          <CardDescription>
            Statuses become columns; priorities and labels tag tasks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="statuses">
            <TabsList>
              <TabsTrigger value="statuses">Statuses</TabsTrigger>
              <TabsTrigger value="priorities">Priorities</TabsTrigger>
              <TabsTrigger value="labels">Labels</TabsTrigger>
            </TabsList>
            <TabsContent value="statuses" className="pt-4">
              <OrderedMetaSection
                noun="Status"
                description="Columns on the kanban board, left to right. Dynamic statuses fill the ring further along the pipeline; mark a status Full for a complete ring (e.g. Done, Cancelled). Full statuses stay below the dynamic ones."
                items={statuses}
                withColor
                ringToggle
                onCreate={(name, color) =>
                  createStatusAction(domain, name, color ?? "#6b7280")
                }
                onRename={(id, name, color) =>
                  updateStatusAction(domain, id, name, color ?? "#6b7280")
                }
                onDelete={(id) => deleteStatusAction(domain, id)}
                onReorder={(ids) => reorderStatusesAction(domain, ids)}
                onToggleFull={(id, next, ids) =>
                  setStatusFullAction(domain, id, next, ids)
                }
              />
            </TabsContent>
            <TabsContent value="priorities" className="pt-4">
              <OrderedMetaSection
                noun="Priority"
                description="Priority levels available to tasks."
                items={priorities}
                onCreate={(name) => createPriorityAction(domain, name)}
                onRename={(id, name) => renamePriorityAction(domain, id, name)}
                onDelete={(id) => deletePriorityAction(domain, id)}
                onReorder={(ids) => reorderPrioritiesAction(domain, ids)}
              />
            </TabsContent>
            <TabsContent value="labels" className="pt-4">
              <LabelsSection domain={domain} labels={labels} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
