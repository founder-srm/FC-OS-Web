import { pgEnum, pgTable as table } from "drizzle-orm/pg-core";
import { serial } from "drizzle-orm/pg-core";

export const rolesEnum = pgEnum("roles", [
  "member",
  "associate lead",
  "co-lead",
  "lead",
  "human resource manager",
  "leadership",
]);

export const roles = table("roles", {
  id: serial("role_id").primaryKey(),
  label: rolesEnum().default("member"),
});

export type demoUsersType = typeof roles;
