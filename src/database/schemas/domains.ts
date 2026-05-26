import { pgEnum, pgTable } from "drizzle-orm/pg-core";

export const domainsEnum = pgEnum("domain", [
  "technical",
  "creatives",
  "operations",
  "outreach",
]);

export const domains = pgTable("domains", {
  id: domainsEnum("domain_id").primaryKey(),
});

export type Domain = typeof domains.$inferSelect;
export type NewDomain = typeof domains.$inferInsert;
