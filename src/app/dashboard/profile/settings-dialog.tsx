"use client";

import { Settings } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { setDomainLeadApproval } from "./actions";

export default function SettingsDialog({
  domainLeadsCanApprove,
}: {
  domainLeadsCanApprove: boolean;
}) {
  const [enabled, setEnabled] = useState(domainLeadsCanApprove);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggle = (next: boolean) => {
    setError(null);
    setEnabled(next); // optimistic
    startTransition(async () => {
      const result = await setDomainLeadApproval(next);
      if ("error" in result) {
        setError(result.error);
        setEnabled(!next); // revert
      }
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Settings">
          <Settings />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage approval permissions for FC OS.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
          <div className="space-y-1">
            <Label htmlFor="domain-lead-approval">
              Domain leads can approve members
            </Label>
            <p className="text-sm text-muted-foreground">
              Let leads and co-leads approve pending members in their own
              domain.
            </p>
          </div>
          <Switch
            id="domain-lead-approval"
            checked={enabled}
            disabled={isPending}
            onCheckedChange={toggle}
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </DialogContent>
    </Dialog>
  );
}
