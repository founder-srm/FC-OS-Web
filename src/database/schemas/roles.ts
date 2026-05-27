import { pgEnum, pgTable } from "drizzle-orm/pg-core";

export const rolesEnum = pgEnum("role_label", [
  "member",
  "associate lead",
  "co-lead",
  "lead",
  "human resource manager",
  "leadership",
]);
export const scopeEnum = pgEnum("scope", ["domain", "global"]);

export const roles = pgTable("roles", {
  id: rolesEnum("role_id").default("member").primaryKey(),
  scope: scopeEnum().default("domain").notNull(),
});

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
