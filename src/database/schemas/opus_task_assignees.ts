import { pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { opusTasks } from "./opus_tasks";
import { profiles } from "./profiles";

export const opusTaskAssignees = pgTable(
  "opus_task_assignees",
  {
    taskId: uuid("task_id")
      .references(() => opusTasks.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.taskId, table.userId] })],
);

export type OpusTaskAssignee = typeof opusTaskAssignees.$inferSelect;
export type NewOpusTaskAssignee = typeof opusTaskAssignees.$inferInsert;
