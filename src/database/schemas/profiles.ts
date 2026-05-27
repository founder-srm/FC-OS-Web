import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { domains, domainsEnum } from "./domains";
import { roles, rolesEnum } from "./roles";

export const profiles = pgTable("profiles", {
  // Placeholder until auth.users is wired into the app.
  id: uuid("user_id").defaultRandom().primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").unique().notNull(),
  phone: text("phone").unique().notNull(),
  roleId: rolesEnum("role_id")
    .references(() => roles.id, { onDelete: "restrict" })
    .notNull(),
  domainId: domainsEnum("domain_id").references(() => domains.id, {
    onDelete: "restrict",
  }),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
