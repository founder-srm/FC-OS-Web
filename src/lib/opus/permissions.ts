// Opus authorization. `ctx.isDomainLead` only covers lead/co-lead, but Opus also
// grants management to associate leads, so it computes its own manager set from
// the raw role ids. Pure functions over the AccessContext — safe to import on the
// server (layout, Server Actions).

import type { AccessContext } from "@/lib/auth/context";
import { DOMAIN_IDS, type DomainId, isDomainId } from "@/lib/opus/format";

// Roles that can create/edit tasks and manage statuses/priorities/labels for the
// domains they belong to.
const DOMAIN_MANAGER_ROLES = new Set<string>([
  "lead",
  "co-lead",
  "associate lead",
]);

const hasManagerRole = (ctx: AccessContext) =>
  ctx.roleIds.some((r) => DOMAIN_MANAGER_ROLES.has(r));

/** Can the user create/edit tasks + manage config for this domain? */
export const canManageDomain = (
  ctx: AccessContext,
  domain: string,
): boolean => {
  if (ctx.isApprover) return true;
  return hasManagerRole(ctx) && ctx.domainIds.includes(domain);
};

/** Domains whose Manage area the user may open (approvers: all). */
export const manageableDomains = (ctx: AccessContext): DomainId[] => {
  if (ctx.isApprover) return [...DOMAIN_IDS];
  if (!hasManagerRole(ctx)) return [];
  return ctx.domainIds.filter(isDomainId);
};

/**
 * Can the user edit a specific task? Managers can edit any task in their domain;
 * plain members can edit only tasks they're assigned to.
 */
export const canEditTask = (
  ctx: AccessContext,
  domain: string,
  assigneeIds: string[],
): boolean => canManageDomain(ctx, domain) || assigneeIds.includes(ctx.userId);
