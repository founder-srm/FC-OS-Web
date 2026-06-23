import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { opusTasks } from "./opus_tasks";

export const opusTaskLinks = pgTable("opus_task_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .references(() => opusTasks.id, { onDelete: "cascade" })
    .notNull(),
  url: text("url").notNull(),
  label: text("label"),
});

export type OpusTaskLink = typeof opusTaskLinks.$inferSelect;
export type NewOpusTaskLink = typeof opusTaskLinks.$inferInsert;
