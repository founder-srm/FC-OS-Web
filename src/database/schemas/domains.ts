import { pgEnum, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";

export const domainsEnum = pgEnum("domain", [
  "technical",
  "creatives",
  "operations",
  "outreach",
]);

export const domains = pgTable(
  "domains",
  {
    id: text("domain_id").unique().primaryKey(),
    label: domainsEnum().notNull(),
  },
  (table) => [uniqueIndex("domains_label_unique").on(table.label)],
);

export type Domain = typeof domains.$inferSelect;
export type NewDomain = typeof domains.$inferInsert;
