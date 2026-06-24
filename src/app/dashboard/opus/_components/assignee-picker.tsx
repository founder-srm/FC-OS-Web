"use client";

import { Check, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { initials } from "@/lib/opus/format";
import { cn } from "@/lib/utils";
import type { BoardAssignee } from "@/utils/opusDbActions";

export function AssigneePicker({
  members,
  value,
  onChange,
}: {
  members: BoardAssignee[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const selected = members.filter((m) => value.includes(m.id));

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
          className="w-full justify-start font-normal"
        >
          <UserPlus className="size-4" />
          {selected.length === 0 ? (
            <span className="text-muted-foreground">Add assignees</span>
          ) : (
            <span className="flex -space-x-1.5">
              {selected.slice(0, 5).map((m) => (
                <Avatar key={m.id} className="size-5 border border-background">
                  <AvatarFallback className="text-[9px]">
                    {initials(m.firstName, m.lastName)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {selected.length > 5 && (
                <span className="pl-2 text-xs text-muted-foreground">
                  +{selected.length - 5}
                </span>
              )}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search members…" />
          <CommandList>
            <CommandEmpty>No members in this domain.</CommandEmpty>
            <CommandGroup>
              {members.map((m) => {
                const isOn = value.includes(m.id);
                return (
                  <CommandItem
                    key={m.id}
                    value={`${m.firstName} ${m.lastName}`}
                    onSelect={() => toggle(m.id)}
                  >
                    <Avatar className="size-6">
                      <AvatarFallback className="text-[10px]">
                        {initials(m.firstName, m.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1">
                      {m.firstName} {m.lastName}
                    </span>
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
