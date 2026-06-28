// Client-safe Opus presentation helpers. No DB / server imports so these can be
// pulled into client components freely.

import {
  type LucideIcon,
  Megaphone,
  Monitor,
  Palette,
  Settings,
} from "lucide-react";
import { DOMAIN_IDS } from "@/lib/validation/onboarding";

export { DOMAIN_IDS };
export type DomainId = (typeof DOMAIN_IDS)[number];

export const formatDomain = (domain: string) =>
  domain.charAt(0).toUpperCase() + domain.slice(1);

/** Per-domain icon, shared across the dashboard and Opus. */
export const domainIcons: Record<DomainId, LucideIcon> = {
  technical: Monitor,
  operations: Settings,
  creatives: Palette,
  outreach: Megaphone,
};

export const isDomainId = (value: string): value is DomainId =>
  (DOMAIN_IDS as readonly string[]).includes(value);

/** Initials for an avatar fallback. */
export const initials = (firstName: string, lastName: string) =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

/** Badge classes for the seeded priorities; custom ones fall back to muted. */
export const priorityBadgeClass = (name: string | null): string => {
  switch (name) {
    case "Urgent":
      return "border-transparent bg-red-500/15 text-red-600 dark:text-red-400";
    case "High":
      return "border-transparent bg-orange-500/15 text-orange-600 dark:text-orange-400";
    case "Medium":
      return "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400";
    case "Low":
      return "border-transparent bg-sky-500/15 text-sky-600 dark:text-sky-400";
    default:
      return "border-transparent bg-muted text-muted-foreground";
  }
};

const CLOSED_STATUS = new Set(["Done", "Cancelled"]);

export const isStatusClosed = (name: string) => CLOSED_STATUS.has(name);

/**
 * Cancelled is a terminal state, not a completion step: it renders as a cross
 * instead of a progress ring, and is excluded from the ring's fraction so the
 * step before it (e.g. "Done") reads as the final/full state.
 */
export const isCancelledStatus = (name: string) => name === "Cancelled";

/** Ring fraction for an ordered status list, skipping the Cancelled terminal. */
export const statusFraction = (
  statuses: { id: string; name: string }[],
  id: string,
): number => {
  const pipeline = statuses.filter((s) => !isCancelledStatus(s.name));
  if (pipeline.length === 0) return 0;
  const index = pipeline.findIndex((s) => s.id === id);
  if (index < 0) return 0;
  return (index + 1) / pipeline.length;
};

/** A due date is "overdue" only while the task is still open. */
export const isOverdue = (dueDate: Date | null, statusName?: string) => {
  if (!dueDate) return false;
  if (statusName && isStatusClosed(statusName)) return false;
  return dueDate.getTime() < Date.now();
};

export const formatDueDate = (dueDate: Date) =>
  dueDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });

/** A readable text color for a hex label background. */
export const labelTextColor = (hex: string): string => {
  const c = hex.replace("#", "");
  if (c.length !== 6) return "#000";
  const r = Number.parseInt(c.slice(0, 2), 16);
  const g = Number.parseInt(c.slice(2, 4), 16);
  const b = Number.parseInt(c.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1a1a1a" : "#ffffff";
};
