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

// Domain leads — may approve members in their own domain when an approver has
// enabled `domainLeadsCanApprove` in app settings.
const DOMAIN_LEAD_ROLES = new Set<string>(["lead", "co-lead"]);

// Read-only roles: view the whole platform, cannot mutate anything.
const READ_ONLY_ROLES = new Set<string>(["advisor", "alumni"]);

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
  /** Has a domain-lead role (`lead`/`co-lead`). */
  isDomainLead: boolean;
  /** Read-only role (`advisor`/`alumni`) — must not perform mutations. */
  isReadOnly: boolean;
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
  const isDomainLead = roleIds.some((r) => DOMAIN_LEAD_ROLES.has(r));
  const isReadOnly = roleIds.some((r) => READ_ONLY_ROLES.has(r));

  return {
    kind: "active",
    ctx: {
      userId: profile.id,
      authUserId: user.id,
      status: profile.status,
      roleIds,
      domainIds,
      isApprover,
      isDomainLead,
      isReadOnly,
    },
  };
}

/** Returns the access context only when a profile exists (any status), else null. */
export async function getAccessContext(): Promise<AccessContext | null> {
  const state = await getAuthState();
  return state.kind === "active" ? state.ctx : null;
}

/**
 * Trust-boundary guard for mutating Server Actions. Returns the access context
 * for an approved, write-capable user, or an `{ error }` to return to the
 * client. Every mutating Server Action must gate through this.
 */
export async function requireWriteAccess(): Promise<
  AccessContext | { error: string }
> {
  const ctx = await getAccessContext();
  if (!ctx) return { error: "You are not signed in." };
  if (ctx.isReadOnly) return { error: "Your role is read-only." };
  return ctx;
}
