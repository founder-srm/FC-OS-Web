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
 * Can the user change a specific task's status? Managers can change any task in
 * their domain; plain members can change only tasks they're assigned to. Status
 * is the *only* field assigned members may change — full edits are manager-only
 * (`canManageDomain`).
 */
export const canChangeTaskStatus = (
  ctx: AccessContext,
  domain: string,
  assigneeIds: string[],
): boolean => canManageDomain(ctx, domain) || assigneeIds.includes(ctx.userId);
