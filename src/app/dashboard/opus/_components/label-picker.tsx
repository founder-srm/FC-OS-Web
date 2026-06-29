"use client";

import { Check, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { OpusLabel } from "@/database/schemas/opus_labels";
import { cn } from "@/lib/utils";

export function LabelPicker({
  labels,
  value,
  onChange,
}: {
  labels: OpusLabel[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const selected = labels.filter((l) => value.includes(l.id));

  const toggle = (id: string) =>
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id],
    );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-start font-semibold"
        >
          <Tag className="size-4" strokeWidth={2.5} />
          {selected.length === 0 ? (
            <span className="text-muted-foreground">Add labels</span>
          ) : (
            <span className="flex flex-wrap gap-1">
              {selected.map((l) => (
                <span
                  key={l.id}
                  className="inline-flex items-center gap-1 text-xs"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: l.color }}
                  />
                  {l.name}
                </span>
              ))}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 font-semibold" align="start">
        <Command>
          <CommandInput placeholder="Search labels…" />
          <CommandList>
            <CommandEmpty>No labels yet.</CommandEmpty>
            <CommandGroup>
              {labels.map((l) => {
                const isOn = value.includes(l.id);
                return (
                  <CommandItem
                    key={l.id}
                    value={l.name}
                    onSelect={() => toggle(l.id)}
                  >
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: l.color }}
                    />
                    <span className="flex-1">{l.name}</span>
                    <Check
                      className={cn(
                        "size-4",
                        isOn ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
