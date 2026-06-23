import { pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { opusLabels } from "./opus_labels";
import { opusTasks } from "./opus_tasks";

export const opusTaskLabels = pgTable(
  "opus_task_labels",
  {
    taskId: uuid("task_id")
      .references(() => opusTasks.id, { onDelete: "cascade" })
      .notNull(),
    labelId: uuid("label_id")
      .references(() => opusLabels.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.taskId, table.labelId] })],
);

export type OpusTaskLabel = typeof opusTaskLabels.$inferSelect;
export type NewOpusTaskLabel = typeof opusTaskLabels.$inferInsert;
