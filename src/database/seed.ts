// Seeds the data-driven reference tables (`domains`, `roles`) that the rest of
// the RBAC model and onboarding depend on. Idempotent: safe to re-run.
//
//   bun run seed   (see package.json — runs this via tsx)
import "dotenv/config";

import { db } from "./db";
import { appSettings } from "./schemas/app_settings";
import { domains } from "./schemas/domains";
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

  console.log("Seeded domains + roles + settings.");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
