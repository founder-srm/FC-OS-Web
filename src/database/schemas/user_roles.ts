import { pgTable, uuid } from "drizzle-orm/pg-core";
import { domains, domainsEnum } from "./domains";
import { profiles } from "./profiles";
import { roles, rolesEnum } from "./roles";

export const userRoles = pgTable("user_roles", {
  id: uuid("user_id")
    .references(() => profiles.id, { onDelete: "cascade" })
    .notNull(),
  role: rolesEnum("role")
    .references(() => roles.id, { onDelete: "cascade" })
    .notNull(),
  domain: domainsEnum("domain").references(() => domains.id, {
    onDelete: "cascade",
  }),
});
