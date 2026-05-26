import { relations } from "drizzle-orm";
import { domains } from "./domains";
import { profiles } from "./profiles";
import { roles } from "./roles";

export const domainsRelations = relations(domains, ({ many }) => ({
  profiles: many(profiles),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  domain: one(domains, {
    fields: [profiles.domainId],
    references: [domains.id],
  }),
  role: one(roles, {
    fields: [profiles.roleId],
    references: [roles.id],
  }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  profiles: many(profiles),
}));
