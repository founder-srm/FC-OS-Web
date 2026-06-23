import { boolean, integer, pgTable, timestamp } from "drizzle-orm/pg-core";

// App-wide settings. Singleton: always exactly one row with `id = 1`.
export const appSettings = pgTable("app_settings", {
  id: integer("id").primaryKey().default(1),
  // When true, domain leads (lead/co-lead) may approve pending members in their
  // own domain. Toggled by approvers from the profile-page settings modal.
  domainLeadsCanApprove: boolean("domain_leads_can_approve")
    .notNull()
    .default(false),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AppSettings = typeof appSettings.$inferSelect;
export type NewAppSettings = typeof appSettings.$inferInsert;
