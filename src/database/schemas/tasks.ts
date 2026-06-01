import { pgTable, text, uuid, timestamp, pgEnum } from "drizzle-orm/pg-core";
import {domains, domainsEnum} from "./domains";
import { profiles } from "./profiles";

export const statusEnum = pgEnum("status", [
  "Not Started",
  "In Progress",
  "Completed",
  "On Hold",
]);

export const tasks = pgTable("tasks", { 
    id : uuid("id").defaultRandom().primaryKey(),
    title : text("title").notNull(),
    status : statusEnum("status").default("Not Started"),
    description : text("description"),
    assignedBy : uuid("assigned_by").references(() => 
        profiles.id, { 
            onDelete: "set null" 
    }).notNull(),
    assignedTo : uuid("assigned_to").references(() => 
        profiles.id, { 
            onDelete: "set null"
    }).array(),
    deadline : timestamp("deadline").notNull(),
    attachment : text("attachment"),
    domain: domainsEnum("domain").references(() => domains.id, {
        onDelete: "restrict",
    }),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;