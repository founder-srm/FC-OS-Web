import { pgEnum, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";

export const rolesEnum = pgEnum("role_label", [
  "member",
  "associate lead",
  "co-lead",
  "lead",
  "human resource manager",
  "leadership",
]);
export const scopeEnum = pgEnum("scope", [
  "domain",
  "global",
]);

export const roles = pgTable(
  "roles",
  {
    id: text("role_id").unique().primaryKey(),
    label: rolesEnum().default("member").notNull(),
    scope: scopeEnum().default("domain").notNull(),
  },
  (table) => [uniqueIndex("roles_label_unique").on(table.label)],
);

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
