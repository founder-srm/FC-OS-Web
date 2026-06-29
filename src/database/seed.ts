// Seeds the data-driven reference tables (`domains`, `roles`) that the rest of
// the RBAC model and onboarding depend on. Idempotent: safe to re-run.
//
//   bun run seed   (see package.json — runs this via tsx)
import "dotenv/config";

import { db } from "./db";
import { appSettings } from "./schemas/app_settings";
import { domains } from "./schemas/domains";
import { opusPriorities } from "./schemas/opus_priorities";
import { opusStatuses } from "./schemas/opus_statuses";
import { roles } from "./schemas/roles";

const DOMAIN_IDS = [
  "technical",
  "creatives",
  "operations",
  "outreach",
] as const;

// `global` roles are not tied to a domain (leadership + HRM); everyone else is
// scoped to the domain(s) they belong to.
const ROLES = [
  { id: "member", scope: "domain" },
  { id: "associate lead", scope: "domain" },
  { id: "co-lead", scope: "domain" },
  { id: "lead", scope: "domain" },
  { id: "human resource manager", scope: "global" },
  { id: "vice president", scope: "global" },
  { id: "president", scope: "global" },
  // Read-only roles, not tied to a domain.
  { id: "advisor", scope: "global" },
  { id: "alumni", scope: "global" },
] as const;

const DEFAULT_STATUSES = [
  { name: "Backlog", position: 0, color: "#6b7280", ringFull: false },
  { name: "Todo", position: 1, color: "#3b82f6", ringFull: false },
  { name: "In Progress", position: 2, color: "#f59e0b", ringFull: false },
  { name: "Done", position: 3, color: "#22c55e", ringFull: true },
  { name: "Cancelled", position: 4, color: "#ef4444", ringFull: true },
] as const;

const DEFAULT_PRIORITIES = [
  { name: "Urgent", position: 0 },
  { name: "High", position: 1 },
  { name: "Medium", position: 2 },
  { name: "Low", position: 3 },
] as const;

async function seed() {
  await db
    .insert(domains)
    .values(DOMAIN_IDS.map((id) => ({ id })))
    .onConflictDoNothing();

  await db
    .insert(roles)
    .values(ROLES.map((r) => ({ id: r.id, scope: r.scope })))
    .onConflictDoNothing();

  // Singleton settings row (id=1), defaults applied by the schema.
  await db.insert(appSettings).values({ id: 1 }).onConflictDoNothing();

  for (const domainId of DOMAIN_IDS) {
    await db
      .insert(opusStatuses)
      .values(
        DEFAULT_STATUSES.map((s) => ({
          domain: domainId,
          name: s.name,
          position: s.position,
          color: s.color,
          ringFull: s.ringFull,
          isDefault: true,
        })),
      )
      .onConflictDoNothing();

    await db
      .insert(opusPriorities)
      .values(
        DEFAULT_PRIORITIES.map((p) => ({
          domain: domainId,
          name: p.name,
          position: p.position,
          isDefault: true,
        })),
      )
      .onConflictDoNothing();
  }

  console.log(
    "Seeded domains + roles + settings + opus statuses + priorities.",
  );
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
