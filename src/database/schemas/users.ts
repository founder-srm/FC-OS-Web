import { uuid, text, integer } from "drizzle-orm/pg-core";
import { pgTable as table } from "drizzle-orm/pg-core";
import { roles } from "./roles";
import { relations } from "drizzle-orm";

export const users = table("demo_users", {
  id: uuid("user_id").unique().primaryKey(), // TODO: When auth implemented add foreign key to auth wala table.
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: integer("role_id").references(() => roles.id),
});


export type demoUsersType = typeof users;
