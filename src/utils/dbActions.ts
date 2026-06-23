// Shared DB actions / query helpers. Writes that cross a trust boundary should
// go through validation + access control at the calling Server Action; these
// helpers own the actual SQL.

import { eq } from "drizzle-orm";
import { db } from "../database/db";
import { type NewProfile, profiles } from "../database/schemas/profiles";
import { userRoles } from "../database/schemas/user_roles";
import type { OnboardingInput } from "../lib/validation/onboarding";

export const pushProfiles = async (values: NewProfile[]) => {
  await db.insert(profiles).values(values);
  return db.select().from(profiles);
};

/**
 * Creates a pending member profile and their domain memberships.
 *
 * Multi-domain membership reuses `user_roles`: one `member` row per chosen
 * domain. The neon-http driver has no interactive transactions, so we generate
 * the id up front and write both statements atomically via `db.batch()`.
 */
export const onboardProfile = async (
  authUserId: string,
  email: string,
  data: OnboardingInput,
) => {
  const profileId = crypto.randomUUID();

  await db.batch([
    db.insert(profiles).values({
      id: profileId,
      authUserId,
      email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth.toISOString().slice(0, 10),
      status: "pending_approval",
    }),
    db.insert(userRoles).values(
      data.domains.map((domain) => ({
        id: profileId,
        role: "member" as const,
        domain,
      })),
    ),
  ]);

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
