import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { domains, domainsEnum } from "./domains";
import { opusPriorities } from "./opus_priorities";
import { opusStatuses } from "./opus_statuses";
import { profiles } from "./profiles";

export const opusTasks = pgTable("opus_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  domain: domainsEnum("domain")
    .references(() => domains.id, { onDelete: "cascade" })
    .notNull(),
  parentTaskId: uuid("parent_task_id").references((): any => opusTasks.id, {
    onDelete: "cascade",
  }),
  title: text("title").notNull(),
  description: text("description"),
  statusId: uuid("status_id")
    .references(() => opusStatuses.id, { onDelete: "restrict" })
    .notNull(),
  priorityId: uuid("priority_id").references(() => opusPriorities.id, {
    onDelete: "restrict",
  }),
  dueDate: timestamp("due_date"),
  position: integer("position").notNull().default(0),
  createdBy: uuid("created_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type OpusTask = typeof opusTasks.$inferSelect;
export type NewOpusTask = typeof opusTasks.$inferInsert;
