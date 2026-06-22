"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PendingMember } from "@/utils/dbActions";
import { decideMember } from "./actions";

const DOMAIN_LABELS: Record<string, string> = {
  technical: "Technical",
  creatives: "Creatives",
  operations: "Operations & Marketing",
  outreach: "Outreach",
};

export default function MemberRequestRow({
  member,
}: {
  member: PendingMember;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const decide = (decision: "approved" | "rejected") => {
    setError(null);
    startTransition(async () => {
      const result = await decideMember(member.id, decision);
      if ("error" in result) setError(result.error);
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium">
          {member.firstName} {member.lastName}
        </p>
        <p className="truncate text-sm text-muted-foreground">{member.email}</p>
        <p className="text-sm text-muted-foreground">{member.phone}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {member.domains.length > 0 ? (
            member.domains.map((domain) => (
              <Badge key={domain} variant="secondary">
                {DOMAIN_LABELS[domain] ?? domain}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">No domains</span>
          )}
        </div>
        {error ? (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          variant="destructive"
          disabled={isPending}
          onClick={() => decide("rejected")}
        >
          Reject
        </Button>
        <Button disabled={isPending} onClick={() => decide("approved")}>
          Approve
        </Button>
      </div>
    </div>
  );
}
