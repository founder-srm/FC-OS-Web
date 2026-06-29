import {
  boolean,
  integer,
  pgTable,
  text,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { domains, domainsEnum } from "./domains";

export const opusStatuses = pgTable(
  "opus_statuses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    domain: domainsEnum("domain")
      .references(() => domains.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    position: integer("position").notNull(),
    color: varchar("color", { length: 7 }).notNull().default("#6b7280"),
    isDefault: boolean("is_default").notNull().default(false),
    // When true, this status always renders a complete ring (a "finished" state)
    // instead of filling by its rank in the dynamic pipeline. Full statuses are kept
    // ordered below all dynamic ones — see statusFraction in @/lib/opus/format.
    ringFull: boolean("ring_full").notNull().default(false),
  },
  (table) => [
    unique("opus_statuses_domain_name_unique").on(table.domain, table.name),
  ],
);

export type OpusStatus = typeof opusStatuses.$inferSelect;
export type NewOpusStatus = typeof opusStatuses.$inferInsert;
