import { eq } from "drizzle-orm";

import { db } from "@/database/db";
import { profiles } from "@/database/schemas/profiles";
import { userRoles } from "@/database/schemas/user_roles";
import { auth } from "./server";

// Roles that may approve/reject member applications and see the HRM tooling.
const APPROVER_ROLES = new Set<string>([
  "human resource manager",
  "vice president",
  "president",
]);

export type ProfileStatus = "pending_approval" | "approved" | "rejected";

export type AccessContext = {
  /** App-side profile id (`profiles.id`) — the stable user id used across the app. */
  userId: string;
  /** Neon Auth user id (`neon_auth.user.id`). */
  authUserId: string;
  status: ProfileStatus;
  roleIds: string[];
  /** Domains the user belongs to (empty for global-only roles). */
  domainIds: string[];
  isApprover: boolean;
};

export type AuthState =
  | { kind: "unauthenticated" }
  | { kind: "no-profile"; authUserId: string }
  | { kind: "active"; ctx: AccessContext };

/**
 * Resolves the current request's auth + onboarding/approval state from the Neon
 * Auth session plus the user's `profiles` row and `user_roles`. Callers must run
 * dynamically (`export const dynamic = "force-dynamic"`).
 */
export async function getAuthState(): Promise<AuthState> {
  const { data } = await auth.getSession();
  const user = data?.user;
  if (!user) return { kind: "unauthenticated" };

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.authUserId, user.id))
    .limit(1);

  if (!profile) return { kind: "no-profile", authUserId: user.id };

  const rows = await db
    .select({ role: userRoles.role, domain: userRoles.domain })
    .from(userRoles)
    .where(eq(userRoles.id, profile.id));

  const roleIds = [...new Set(rows.map((r) => r.role))];
  const domainIds = [
    ...new Set(
      rows
        .map((r) => r.domain)
        .filter((d): d is NonNullable<typeof d> => d !== null),
    ),
  ];
  const isApprover = roleIds.some((r) => APPROVER_ROLES.has(r));

  return {
    kind: "active",
    ctx: {
      userId: profile.id,
      authUserId: user.id,
      status: profile.status,
      roleIds,
      domainIds,
      isApprover,
    },
  };
}

/** Returns the access context only when a profile exists (any status), else null. */
export async function getAccessContext(): Promise<AccessContext | null> {
  const state = await getAuthState();
  return state.kind === "active" ? state.ctx : null;
}
