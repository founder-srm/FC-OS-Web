"use server";

import { revalidatePath } from "next/cache";

import { getAccessContext } from "@/lib/auth/context";
import { setMemberDecision } from "@/utils/dbActions";

export type DecisionResult = { ok: true } | { error: string };

export async function decideMember(
  profileId: string,
  decision: "approved" | "rejected",
): Promise<DecisionResult> {
  const ctx = await getAccessContext();
  if (!ctx?.isApprover) return { error: "You are not allowed to do that." };

  await setMemberDecision(ctx.userId, profileId, decision);
  revalidatePath("/dashboard/member-requests");
  return { ok: true };
}
