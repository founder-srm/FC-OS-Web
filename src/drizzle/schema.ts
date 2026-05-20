import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const domains = pgTable(
  "domains",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("domains_slug_format_check", sql`${table.slug} ~ '^[a-z0-9_]+$'`),
  ],
);

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    level: integer("level").default(0).notNull(),
    isSystemRole: boolean("is_system_role").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("roles_slug_format_check", sql`${table.slug} ~ '^[a-z0-9_]+$'`),
    check(
      "roles_level_range_check",
      sql`${table.level} >= 0 AND ${table.level} <= 100`,
    ),
  ],
);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    fullName: text("full_name")
      .generatedAlwaysAs(sql`"first_name" || ' ' || "last_name"`)
      .notNull(),
    netID: varchar("net_id", { length: 6 }).notNull().unique(),
    email: text("email")
      .generatedAlwaysAs(sql`"net_id" || '@srmist.edu.in'`)
      .notNull(),
    phone: varchar("phone", { length: 13 }).notNull(),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    domainId: uuid("domain_id")
      .notNull()
      .references(() => domains.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
  },
  (table) => [
    check(
      "profiles_net_id_format_check",
      sql`${table.netID} ~ '^[a-z]{2}[0-9]{4}$'`,
    ),
    check(
      "profiles_phone_format_check",
      sql`${table.phone} ~ '^\\+91[6-9][0-9]{9}$'`,
    ),
    index("profiles_role_id_idx").on(table.roleId),
    index("profiles_domain_id_idx").on(table.domainId),
  ],
);

export const domainsRelations = relations(domains, ({ many }) => ({
  profiles: many(profiles),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  profiles: many(profiles),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  role: one(roles, {
    fields: [profiles.roleId],
    references: [roles.id],
  }),
  domain: one(domains, {
    fields: [profiles.domainId],
    references: [domains.id],
  }),
}));
