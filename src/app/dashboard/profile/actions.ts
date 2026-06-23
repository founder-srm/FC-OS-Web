"use server";

import { revalidatePath } from "next/cache";

import { requireWriteAccess } from "@/lib/auth/context";
import { setDomainLeadsCanApprove } from "@/utils/dbActions";

export type SettingsResult = { ok: true } | { error: string };

/** Approver-only: toggle whether domain leads can approve members. */
export async function setDomainLeadApproval(
  enabled: boolean,
): Promise<SettingsResult> {
  const ctx = await requireWriteAccess();
  if ("error" in ctx) return ctx;
  if (!ctx.isApprover) return { error: "You are not allowed to do that." };

  await setDomainLeadsCanApprove(enabled);
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/member-requests");
  return { ok: true };
}
