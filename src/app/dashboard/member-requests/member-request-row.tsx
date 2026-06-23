"use client";

import { Loader2, Plus, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PendingMember } from "@/utils/dbActions";
import { decideMember } from "./actions";

const DOMAIN_LABELS: Record<string, string> = {
  technical: "Technical",
  creatives: "Creatives",
  operations: "Operations & Marketing",
  outreach: "Outreach",
};

const ROLES = [
  "member",
  "associate lead",
  "co-lead",
  "lead",
  "human resource manager",
  "vice president",
  "president",
  "advisor",
  "alumni",
] as const;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function MemberRequestRow({
  member,
}: {
  member: PendingMember;
}) {
  const [isPending, startTransition] = useTransition();
  // Which button fired, so its spinner shows (isPending alone can't tell us).
  const [action, setAction] = useState<"approved" | "rejected" | null>(null);
  // One role per requested domain, defaulting to `member` (the onboarding role).
  const [roles, setRoles] = useState<Record<string, string>>(() =>
    Object.fromEntries(member.domains.map((d) => [d, "member"])),
  );
  // Domains the approver keeps for this member. Approvers can drop a domain the
  // applicant mis-applied for; removed ones can be added back before deciding.
  const [kept, setKept] = useState<string[]>(member.domains);
  const removed = member.domains.filter((d) => !kept.includes(d));

  const name = `${member.firstName} ${member.lastName}`;

  const decide = (decision: "approved" | "rejected") => {
    setAction(decision);
    const assignments =
      decision === "approved"
        ? kept.map((d) => ({ role: roles[d], domain: d }))
        : undefined;
    startTransition(async () => {
      try {
        const result = await decideMember(member.id, decision, assignments);
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        toast.success(
          decision === "approved" ? `${name} approved.` : `${name} rejected.`,
        );
      } finally {
        setAction(null);
      }
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium">
          {member.firstName} {member.lastName}
        </p>
        <p className="truncate text-sm text-muted-foreground">{member.email}</p>
        <p className="text-sm text-muted-foreground">{member.phone}</p>
        {member.domains.length > 0 ? (
          <div className="mt-3 flex flex-col gap-2">
            {kept.map((domain) => (
              <div key={domain} className="flex items-center gap-2">
                <Badge variant="secondary" className="shrink-0">
                  {DOMAIN_LABELS[domain] ?? domain}
                </Badge>
                <Select
                  value={roles[domain]}
                  onValueChange={(v) =>
                    setRoles((prev) => ({ ...prev, [domain]: v }))
                  }
                  disabled={isPending}
                >
                  <SelectTrigger size="sm" className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {capitalize(r)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground"
                  disabled={isPending}
                  aria-label={`Remove ${DOMAIN_LABELS[domain] ?? domain}`}
                  onClick={() =>
                    setKept((prev) => prev.filter((d) => d !== domain))
                  }
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
            {kept.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No domains kept — add at least one to approve.
              </p>
            ) : null}
            {removed.length > 0 ? (
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Removed:</span>
                {removed.map((domain) => (
                  <Button
                    key={domain}
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    disabled={isPending}
                    onClick={() => setKept((prev) => [...prev, domain])}
                  >
                    <Plus className="size-3" />
                    {DOMAIN_LABELS[domain] ?? domain}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No domains</p>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          variant="destructive"
          disabled={isPending}
          onClick={() => decide("rejected")}
        >
          {action === "rejected" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : null}
          Reject
        </Button>
        <Button
          disabled={
            isPending || (member.domains.length > 0 && kept.length === 0)
          }
          onClick={() => decide("approved")}
        >
          {action === "approved" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : null}
          Approve
        </Button>
      </div>
    </div>
  );
}
