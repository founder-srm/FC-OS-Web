"use server";

import { revalidatePath } from "next/cache";
import { rolesEnum } from "@/database/schemas/roles";
import { requireWriteAccess } from "@/lib/auth/context";
import {
  getAppSettings,
  getProfileDomains,
  type RoleLabel,
  setMemberDecision,
  setMemberRoles,
} from "@/utils/dbActions";

export type DecisionResult = { ok: true } | { error: string };

export type RoleAssignment = { role: string; domain: string };

const VALID_ROLES = new Set<string>(rolesEnum.enumValues);

export async function decideMember(
  profileId: string,
  decision: "approved" | "rejected",
  assignments?: RoleAssignment[],
): Promise<DecisionResult> {
  const ctx = await requireWriteAccess();
  if ("error" in ctx) return ctx;

  // Approvers (HRM/VP/President) decide on any member. Domain leads may decide
  // on members in their own domain, but only when an approver has enabled it.
  const memberDomains = await getProfileDomains(profileId);
  let allowed = ctx.isApprover;
  if (!allowed && ctx.isDomainLead) {
    const { domainLeadsCanApprove } = await getAppSettings();
    if (domainLeadsCanApprove) {
      allowed = memberDomains.some((d) => ctx.domainIds.includes(d));
    }
  }
  if (!allowed) return { error: "You are not allowed to do that." };

  // On approve, persist the (possibly trimmed) per-domain roles. Approvers can
  // drop domains the applicant mis-applied for, but at least one must remain.
  if (decision === "approved" && memberDomains.length > 0) {
    if (!assignments || assignments.length === 0)
      return { error: "Keep the member in at least one domain." };
    const allowedDomains = new Set(memberDomains);
    for (const a of assignments) {
      if (!VALID_ROLES.has(a.role)) return { error: "Invalid role." };
      if (!allowedDomains.has(a.domain))
        return { error: "Invalid domain for this member." };
    }
    await setMemberRoles(
      profileId,
      assignments.map((a) => ({ role: a.role as RoleLabel, domain: a.domain })),
    );
  }

  await setMemberDecision(ctx.userId, profileId, decision);
  revalidatePath("/dashboard/member-requests");
  return { ok: true };
}
