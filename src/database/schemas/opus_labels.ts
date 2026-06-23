import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { domains, domainsEnum } from "./domains";

export const opusLabels = pgTable("opus_labels", {
  id: uuid("id").defaultRandom().primaryKey(),
  domain: domainsEnum("domain")
    .references(() => domains.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  color: varchar("color", { length: 7 }).notNull(),
});

export type OpusLabel = typeof opusLabels.$inferSelect;
export type NewOpusLabel = typeof opusLabels.$inferInsert;
