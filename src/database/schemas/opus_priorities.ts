import {
  boolean,
  integer,
  pgTable,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { domains, domainsEnum } from "./domains";

export const opusPriorities = pgTable(
  "opus_priorities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    domain: domainsEnum("domain")
      .references(() => domains.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    position: integer("position").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
  },
  (table) => [
    unique("opus_priorities_domain_name_unique").on(table.domain, table.name),
  ],
);

export type OpusPriority = typeof opusPriorities.$inferSelect;
export type NewOpusPriority = typeof opusPriorities.$inferInsert;
