// Shared DB actions / query helpers. Writes that cross a trust boundary should
// go through validation + access control at the calling Server Action; these
// helpers own the actual SQL.

import { eq } from "drizzle-orm";
import { db } from "../database/db";
import { appSettings } from "../database/schemas/app_settings";
import { type NewProfile, profiles } from "../database/schemas/profiles";
import type { rolesEnum } from "../database/schemas/roles";
import { userRoles } from "../database/schemas/user_roles";
import type { OnboardingInput } from "../lib/validation/onboarding";

export type RoleLabel = (typeof rolesEnum.enumValues)[number];
type NewUserRole = typeof userRoles.$inferInsert;

export const pushProfiles = async (values: NewProfile[]) => {
  await db.insert(profiles).values(values);
  return db.select().from(profiles);
};

/**
 * Creates a pending member profile and their domain memberships.
 *
 * Multi-domain membership reuses `user_roles`: one `member` row per chosen
 * domain. We generate the id up front and write the profile + its role rows
 * atomically in a single transaction.
 */
export const onboardProfile = async (
  authUserId: string,
  email: string,
  data: OnboardingInput,
) => {
  const profileId = crypto.randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(profiles).values({
      id: profileId,
      authUserId,
      email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth.toISOString().slice(0, 10),
      status: "pending_approval",
    });
    await tx.insert(userRoles).values(
      data.domains.map((domain) => ({
        id: profileId,
        role: "member" as const,
        domain,
      })),
    );
  });

  return profileId;
};

/** Loads pending applications with their requested domains, for the HRM page. */
export const getPendingMembers = async () => {
  const rows = await db
    .select({
      id: profiles.id,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      email: profiles.email,
      phone: profiles.phone,
      domain: userRoles.domain,
    })
    .from(profiles)
    .leftJoin(userRoles, eq(userRoles.id, profiles.id))
    .where(eq(profiles.status, "pending_approval"));

  // Collapse the per-domain join rows into one entry per profile.
  const byProfile = new Map<
    string,
    {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      domains: string[];
    }
  >();

  for (const row of rows) {
    const existing = byProfile.get(row.id);
    if (existing) {
      if (row.domain) existing.domains.push(row.domain);
    } else {
      byProfile.set(row.id, {
        id: row.id,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        phone: row.phone,
        domains: row.domain ? [row.domain] : [],
      });
    }
  }

  return [...byProfile.values()];
};

export type PendingMember = Awaited<
  ReturnType<typeof getPendingMembers>
>[number];

/** Returns all approved members with their domains and roles, for the directory. */
export const getApprovedMembers = async () => {
  const rows = await db
    .select({
      id: profiles.id,
      authUserId: profiles.authUserId,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      email: profiles.email,
      phone: profiles.phone,
      gender: profiles.gender,
      dateOfBirth: profiles.dateOfBirth,
      status: profiles.status,
      approvedBy: profiles.approvedBy,
      decidedAt: profiles.decidedAt,
      domain: userRoles.domain,
      role: userRoles.role,
    })
    .from(profiles)
    .leftJoin(userRoles, eq(userRoles.id, profiles.id))
    .where(eq(profiles.status, "approved"))
    .orderBy(profiles.firstName);

  const byProfile = new Map<
    string,
    {
      id: string;
      authUserId: string | null;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      gender: "male" | "female" | null;
      dateOfBirth: string | null;
      status: "pending_approval" | "approved" | "rejected";
      approvedBy: string | null;
      decidedAt: Date | null;
      domains: string[];
      rolePairs: { role: string; domain: string | null }[];
    }
  >();

  for (const row of rows) {
    const existing = byProfile.get(row.id);
    if (existing) {
      if (row.domain && !existing.domains.includes(row.domain))
        existing.domains.push(row.domain);
      const alreadyHasPair = existing.rolePairs.some(
        (p) => p.role === row.role && p.domain === row.domain,
      );
      if (row.role && !alreadyHasPair)
        existing.rolePairs.push({ role: row.role, domain: row.domain });
    } else {
      byProfile.set(row.id, {
        id: row.id,
        authUserId: row.authUserId,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        phone: row.phone,
        gender: row.gender,
        dateOfBirth: row.dateOfBirth,
        status: row.status,
        approvedBy: row.approvedBy,
        decidedAt: row.decidedAt,
        domains: row.domain ? [row.domain] : [],
        rolePairs: row.role ? [{ role: row.role, domain: row.domain }] : [],
      });
    }
  }

  return [...byProfile.values()];
};

export type ApprovedMember = Awaited<
  ReturnType<typeof getApprovedMembers>
>[number];

/** Loads a profile's basic identity + role/domain pairs, for the profile page. */
export const getProfile = async (profileId: string) => {
  const rows = await db
    .select({
      id: profiles.id,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      email: profiles.email,
      phone: profiles.phone,
      role: userRoles.role,
      domain: userRoles.domain,
    })
    .from(profiles)
    .leftJoin(userRoles, eq(userRoles.id, profiles.id))
    .where(eq(profiles.id, profileId));

  const first = rows[0];
  if (!first) return null;

  const roles = [...new Set(rows.map((r) => r.role).filter((r) => r !== null))];
  const domains = [
    ...new Set(rows.map((r) => r.domain).filter((d) => d !== null)),
  ];

  return {
    id: first.id,
    firstName: first.firstName,
    lastName: first.lastName,
    email: first.email,
    phone: first.phone,
    roles,
    domains,
  };
};

/** Reads the singleton app settings row, falling back to defaults if unseeded. */
export const getAppSettings = async (): Promise<{
  domainLeadsCanApprove: boolean;
}> => {
  const [row] = await db
    .select({ domainLeadsCanApprove: appSettings.domainLeadsCanApprove })
    .from(appSettings)
    .where(eq(appSettings.id, 1))
    .limit(1);

  return { domainLeadsCanApprove: row?.domainLeadsCanApprove ?? false };
};

/** Upserts the singleton settings row to toggle domain-lead approval. */
export const setDomainLeadsCanApprove = async (enabled: boolean) => {
  await db
    .insert(appSettings)
    .values({ id: 1, domainLeadsCanApprove: enabled, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: { domainLeadsCanApprove: enabled, updatedAt: new Date() },
    });
};

/** Returns the domain ids a profile belongs to (from `user_roles`). */
export const getProfileDomains = async (
  profileId: string,
): Promise<string[]> => {
  const rows = await db
    .select({ domain: userRoles.domain })
    .from(userRoles)
    .where(eq(userRoles.id, profileId));

  return [
    ...new Set(
      rows
        .map((r) => r.domain)
        .filter((d): d is NonNullable<typeof d> => d !== null),
    ),
  ];
};

// Roles that aren't tied to a domain (mirrors `seed.ts`): leadership + HRM and
// the read-only roles. Stored in `user_roles` with `domain = null`.
const GLOBAL_ROLES = new Set<string>([
  "human resource manager",
  "vice president",
  "president",
  "advisor",
  "alumni",
]);

/**
 * Replaces a profile's role assignments. Domain-scoped roles keep their domain;
 * global roles collapse to a single `domain = null` row (deduped). The
 * delete + insert run atomically in a single transaction.
 */
export const setMemberRoles = async (
  profileId: string,
  assignments: { role: RoleLabel; domain: string }[],
) => {
  const seenGlobal = new Set<string>();
  const rows: NewUserRole[] = [];

  for (const { role, domain } of assignments) {
    if (GLOBAL_ROLES.has(role)) {
      if (seenGlobal.has(role)) continue;
      seenGlobal.add(role);
      rows.push({ id: profileId, role, domain: null });
    } else {
      rows.push({
        id: profileId,
        role,
        domain: domain as NewUserRole["domain"],
      });
    }
  }

  if (rows.length === 0) {
    await db.delete(userRoles).where(eq(userRoles.id, profileId));
    return;
  }

  await db.transaction(async (tx) => {
    await tx.delete(userRoles).where(eq(userRoles.id, profileId));
    await tx.insert(userRoles).values(rows);
  });
};

/** Records an HRM/leadership approval decision + audit. */
export const setMemberDecision = async (
  approverId: string,
  profileId: string,
  status: "approved" | "rejected",
) => {
  await db
    .update(profiles)
    .set({ status, approvedBy: approverId, decidedAt: new Date() })
    .where(eq(profiles.id, profileId));
};
