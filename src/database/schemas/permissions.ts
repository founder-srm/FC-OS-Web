import { pgTable,text } from "drizzle-orm/pg-core";

export const permissions = pgTable(
  "permissions",
  {
    id: text("permission_id").unique().primaryKey(),
    label: text("permission_label").notNull(),
    description: text("permission_description"),
  },
);

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;