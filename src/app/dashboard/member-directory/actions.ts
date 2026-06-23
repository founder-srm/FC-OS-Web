"use server";

import { revalidatePath } from "next/cache";
import { domainsEnum } from "@/database/schemas/domains";
import { rolesEnum } from "@/database/schemas/roles";
import { requireWriteAccess } from "@/lib/auth/context";
import {
  type RoleLabel,
  setMemberDecision,
  setMemberRoles,
} from "@/utils/dbActions";

export type ManageResult = { ok: true } | { error: string };

export type RoleAssignment = { role: string; domain: string };

const VALID_ROLES = new Set<string>(rolesEnum.enumValues);
const VALID_DOMAINS = new Set<string>(domainsEnum.enumValues);

// Roles not tied to a domain (mirrors `dbActions.setMemberRoles`). For these the
// domain is ignored, so we don't require a valid one.
const GLOBAL_ROLES = new Set<string>([
  "human resource manager",
  "vice president",
  "president",
  "advisor",
  "alumni",
]);

// Approver roles (mirrors `APPROVER_ROLES` in `lib/auth/context`). Used to stop an
// approver from demoting/removing themselves and locking out of management.
const APPROVER_ROLES = new Set<string>([
  "human resource manager",
  "vice president",
  "president",
]);

/**
 * Replaces an approved member's domain/role assignments from the directory.
 * Approver-only (President/VP/HRM); domain leads are not granted this here.
 */
export async function updateMember(
  profileId: string,
  assignments: RoleAssignment[],
): Promise<ManageResult> {
  const ctx = await requireWriteAccess();
  if ("error" in ctx) return ctx;
  if (!ctx.isApprover) return { error: "You are not allowed to do that." };

  if (assignments.length === 0)
    return { error: "Give the member at least one role." };

  // Don't let an approver strip their own approver role and lock themselves out.
  if (
    profileId === ctx.userId &&
    !assignments.some((a) => APPROVER_ROLES.has(a.role))
  )
    return { error: "You can't remove your own approver role." };

  for (const a of assignments) {
    if (!VALID_ROLES.has(a.role)) return { error: "Invalid role." };
    if (!GLOBAL_ROLES.has(a.role) && !VALID_DOMAINS.has(a.domain))
      return { error: "Invalid domain." };
  }

  await setMemberRoles(
    profileId,
    assignments.map((a) => ({ role: a.role as RoleLabel, domain: a.domain })),
  );

  revalidatePath("/dashboard/member-directory");
  return { ok: true };
}

/** Soft-removes a member from the directory by setting status to `rejected`. */
export async function removeMember(profileId: string): Promise<ManageResult> {
  const ctx = await requireWriteAccess();
  if ("error" in ctx) return ctx;
  if (!ctx.isApprover) return { error: "You are not allowed to do that." };
  if (profileId === ctx.userId) return { error: "You can't remove yourself." };

  await setMemberDecision(ctx.userId, profileId, "rejected");

  revalidatePath("/dashboard/member-directory");
  return { ok: true };
}
